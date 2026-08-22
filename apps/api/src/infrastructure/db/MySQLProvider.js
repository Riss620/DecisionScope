const mysql = require('mysql2/promise');

class MySQLProvider {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'decisionscope',
      password: process.env.MYSQL_PASSWORD || 'decisionscope_password',
      database: process.env.MYSQL_DATABASE || 'decisionscope',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  async init() {
    try {
      console.log('Initializing MySQL tables...');
      
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
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
      
      console.log('MySQL tables initialized successfully.');
    } catch (err) {
      console.error('Failed to initialize MySQL tables:', err);
      throw err;
    }
  }

  async insertDecision(id, userId, policyContext, proposedAction) {
    try {
      await this.pool.query(
        'INSERT INTO decisions (id, user_id, policy_context, proposed_action, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE policy_context=VALUES(policy_context), proposed_action=VALUES(proposed_action)',
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
          'UPDATE decisions SET status = ?, final_recommendation = ? WHERE id = ?',
          [status, finalRecommendation, id]
        );
      } else {
        await this.pool.query(
          'UPDATE decisions SET status = ?, final_recommendation = ?, confidence = ? WHERE id = ?',
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
      const [rows] = await this.pool.query('SELECT * FROM decisions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
      return rows;
    } catch (err) {
      console.error('Error fetching decisions:', err);
      return [];
    }
  }

  async deleteDecision(id, userId) {
    try {
      if (!userId || !id) return false;
      const [result] = await this.pool.query('DELETE FROM decisions WHERE id = ? AND user_id = ?', [id, userId]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Error deleting decision:', err);
      return false;
    }
  }

  async getStats() {
    try {
      const [totalRows] = await this.pool.query('SELECT COUNT(*) as count FROM decisions');
      const [statusRows] = await this.pool.query('SELECT status, COUNT(*) as count FROM decisions GROUP BY status');
      const [confidenceRows] = await this.pool.query('SELECT AVG(confidence) as avg_confidence FROM decisions WHERE confidence IS NOT NULL');
      
      const stats = {
        total: totalRows[0].count,
        byStatus: statusRows.reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {}),
        avgConfidence: confidenceRows[0].avg_confidence ? Math.round(confidenceRows[0].avg_confidence) : 0
      };
      return stats;
    } catch (err) {
      console.error('Error fetching stats:', err);
      return { total: 0, byStatus: {}, avgConfidence: 0 };
    }
  }
  async createUser(id, email, passwordHash) {
    try {
      await this.pool.query('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [id, email, passwordHash]);
      return true;
    } catch (err) {
      console.error('Error creating user:', err);
      return false;
    }
  }

  async findUserByEmail(email) {
    try {
      const [rows] = await this.pool.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (err) {
      console.error('Error finding user:', err);
      return null;
    }
  }

  async findUserById(id) {
    try {
      const [rows] = await this.pool.query('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0];
    } catch (err) {
      console.error('Error finding user by id:', err);
      return null;
    }
  }
}

module.exports = { MySQLProvider };
