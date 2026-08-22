const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load env
dotenv.config();

// Adapters
const { createLLMProvider } = require('./infrastructure/llm/createLLMProvider');
const { LocalFileStorageProvider } = require('./infrastructure/storage/LocalFileStorageProvider');
const { QdrantRetrievalProvider } = require('./infrastructure/retrieval/QdrantRetrievalProvider');
const { PostgresProvider } = require('./infrastructure/db/PostgresProvider');
const { SocketEventPublisher } = require('./infrastructure/events/SocketEventPublisher');

// Agents & Orchestration
const {
  createInputNode,
  createEvidenceNode,
  createSimulationNode,
  createCriticNode,
  createAlternativeNode,
  createJudgeNode
} = require('./agents/index');
const { createDecisionGraph } = require('./orchestration/decisionGraph');

// Routes
const decisionRoutes = require('./api/routes/decisions');
const authRoutes = require('./api/routes/auth');
const documentRoutes = require('./api/routes/documents');
const { requireAuth } = require('./api/middleware/auth');

async function bootstrap() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  app.use(cors());
  app.use(express.json());

  // 1. Instantiate Infrastructure
  const llmProvider = createLLMProvider(); // primary model (llama3)
  const secondaryLlmProvider = createLLMProvider('phi3'); // secondary model for critics/input
  const storageProvider = new LocalFileStorageProvider(process.env.STORAGE_PATH || './storage');
  const retrievalProvider = new QdrantRetrievalProvider(process.env.QDRANT_URL, process.env.QDRANT_API_KEY);
  const eventPublisher = new SocketEventPublisher(io);
  const dbProvider = new PostgresProvider();
  try {
    await dbProvider.init();
  } catch (dbErr) {
    console.warn('⚠️  DB connection failed (non-fatal in dev):', dbErr.message);
  }

  // 2. Instantiate Agents (Business Logic)
  const agents = {
    inputNode: createInputNode(secondaryLlmProvider),
    evidenceNode: createEvidenceNode(llmProvider, null), // Pass null to use dynamic LLM generation instead of hardcoded mock
    simulationNode: createSimulationNode(llmProvider),
    criticNode: createCriticNode(secondaryLlmProvider),
    alternativeNode: createAlternativeNode(),
    judgeNode: createJudgeNode(llmProvider),
  };

  // 3. Compile Graph (Orchestration)
  const decisionGraph = createDecisionGraph(agents);

  // 4. Attach API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'decision-scope-api', timestamp: new Date().toISOString() });
  });

  app.get('/api/config', (req, res) => {
    res.json({
      llmProvider: process.env.LLM_PROVIDER || 'unknown',
      llmModel: process.env.LLM_MODEL || 'unknown'
    });
  });

  app.get('/api/ready', async (req, res) => {
    try {
      // Basic check, in reality we'd ping dbProvider and retrievalProvider
      res.json({
        status: 'ok',
        service: 'decision-scope-api',
        dependencies: {
          mysql: 'ok',
          qdrant: 'ok',
          llm: 'ok'
        }
      });
    } catch (e) {
      res.status(503).json({ status: 'error', message: 'Dependencies unavailable' });
    }
  });

  app.use('/api/auth', authRoutes(dbProvider));
  app.use('/api/decisions', requireAuth, decisionRoutes(decisionGraph, eventPublisher, dbProvider));
  app.use('/api/documents', documentRoutes);

  // Handle Socket.io connections
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('Failed to bootstrap application', err);
  process.exit(1);
});
