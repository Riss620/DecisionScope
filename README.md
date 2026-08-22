# DecisionScope

DecisionScope is an AI-powered policy analysis and simulation platform. It helps organizations understand the impacts of policy changes by ingesting documents, extracting structured decision parameters using LLMs, and simulating the downstream effects on stakeholders.

## Features

- **Document Ingestion**: Upload policy documents (PDF, DOCX). The system automatically extracts text (falling back to LLM-powered OCR if necessary).
- **Structured Extraction**: Uses advanced Language Models to automatically extract the proposed actions, context, and affected parameters.
- **Multi-Agent Simulation Pipeline**:
  - **Evidence Analysis**: Gathers historical facts and context.
  - **Stakeholder Impact Simulation**: Estimates positive and negative impacts on various groups.
  - **Critical Consequence Identification**: Critic agents challenge the proposed changes to surface edge cases.
  - **Alternative Generation**: Suggests alternative policy adjustments based on the impacts.
  - **Final Recommendation**: Summarizes the decision with a confidence score.
- **Interactive UI**: Clean, modern React dashboard (built with Vite and TailwindCSS) to track simulations and active scenarios.

## Tech Stack

### Frontend (apps/web)
- React & Vite
- Tailwind CSS & Framer Motion
- Recharts for data visualization
- React Router

### Backend (apps/api)
- Node.js & Express
- LangChain & OpenAI / Google Gemini integrations
- PostgreSQL (via pg)
- Qdrant (Vector Database for RAG / Historical Context)
- Socket.IO

## Getting Started

1. Set up the environment variables (see `apps/api/.env.example`).
2. Install dependencies:
   ```bash
   cd apps/api && npm install
   cd ../web && npm install
   ```
3. Run the development servers:
   ```bash
   # Terminal 1: Start the API
   cd apps/api && npm run dev

   # Terminal 2: Start the Web App
   cd apps/web && npm run dev
   ```
4. Access the application at `http://localhost:5173`.
