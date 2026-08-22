const { Pool } = require('pg');

class PostgresProvider {
  constructor() {
    const connectionConfig = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'decisionscope',
        };
    this.pool = new Pool(connectionConfig);
  }

  async init() {
    try {
      console.log('Initializing PostgreSQL tables...');
      
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS decisions (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255),
          policy_context TEXT NOT NULL,
          proposed_action TEXT NOT NULL,
          final_recommendation TEXT,
          confidence INT,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      
      // Attempt to add user_id to existing table safely (ignore if exists)
      try {
        await this.pool.query('ALTER TABLE decisions ADD COLUMN user_id VARCHAR(255)');
        await this.pool.query('ALTER TABLE decisions ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
      } catch (e) {
        // Column likely exists, which is fine
      }
      
      console.log('PostgreSQL tables initialized successfully.');
    } catch (err) {
      console.error('Failed to initialize PostgreSQL tables:', err);
      throw err;
    }
  }

  async insertDecision(id, userId, policyContext, proposedAction) {
    try {
      await this.pool.query(
        `INSERT INTO decisions (id, user_id, policy_context, proposed_action, status) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (id) DO UPDATE SET policy_context=EXCLUDED.policy_context, proposed_action=EXCLUDED.proposed_action`,
        [id, userId, policyContext, proposedAction, 'pending']
      );
    } catch (err) {
      console.error('Error inserting decision:', err);
    }
  }

  async updateDecision(id, updateData) {
    try {
      const { status, finalRecommendation, confidence } = updateData;
      
      if (status === 'error') {
        await this.pool.query(
          'UPDATE decisions SET status = $1, final_recommendation = $2 WHERE id = $3',
          [status, finalRecommendation, id]
        );
      } else {
        await this.pool.query(
          'UPDATE decisions SET status = $1, final_recommendation = $2, confidence = $3 WHERE id = $4',
          [status, finalRecommendation, confidence, id]
        );
      }
    } catch (err) {
      console.error('Error updating decision:', err);
    }
  }

  async getDecisions(userId) {
    try {
      if (!userId) return [];
      const { rows } = await this.pool.query('SELECT * FROM decisions WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return rows;
    } catch (err) {
      console.error('Error fetching decisions:', err);
      return [];
    }
  }

  async deleteDecision(id, userId) {
    try {
      if (!userId || !id) return false;
      const { rowCount } = await this.pool.query('DELETE FROM decisions WHERE id = $1 AND user_id = $2', [id, userId]);
      return rowCount > 0;
    } catch (err) {
      console.error('Error deleting decision:', err);
      return false;
    }
  }

  async getStats() {
    try {
      const { rows: totalRows } = await this.pool.query('SELECT COUNT(*) as count FROM decisions');
      const { rows: statusRows } = await this.pool.query('SELECT status, COUNT(*) as count FROM decisions GROUP BY status');
      const { rows: confidenceRows } = await this.pool.query('SELECT AVG(confidence) as avg_confidence FROM decisions WHERE confidence IS NOT NULL');
      
      const stats = {
        total: parseInt(totalRows[0].count, 10),
        byStatus: statusRows.reduce((acc, row) => ({ ...acc, [row.status]: parseInt(row.count, 10) }), {}),
        avgConfidence: confidenceRows[0].avg_confidence ? Math.round(parseFloat(confidenceRows[0].avg_confidence)) : 0
      };
      return stats;
    } catch (err) {
      console.error('Error fetching stats:', err);
      return { total: 0, byStatus: {}, avgConfidence: 0 };
    }
  }

  async createUser(id, email, passwordHash) {
    try {
      await this.pool.query('INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)', [id, email, passwordHash]);
      return true;
    } catch (err) {
      console.error('Error creating user:', err);
      return false;
    }
  }

  async findUserByEmail(email) {
    try {
      const { rows } = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return rows[0];
    } catch (err) {
      console.error('Error finding user:', err);
      return null;
    }
  }

  async findUserById(id) {
    try {
      const { rows } = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return rows[0];
    } catch (err) {
      console.error('Error finding user by id:', err);
      return null;
    }
  }
}

module.exports = { PostgresProvider };
