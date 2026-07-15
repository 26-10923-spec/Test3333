import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// In-Memory fallback database for when DATABASE_URL is not set
const mockDb: {
  users: Record<string, any>;
} = {
  users: {}
};

let pool: Pool | null = null;
let isDbHealthy = false;

function getDbPool(): Pool | null {
  if (pool) return pool;

  const dbUrl = process.env.DATABASE_URL;
  // Fallback to memory if DATABASE_URL is not set or contains default placeholder
  if (!dbUrl || dbUrl.includes('user:password@host/dbname')) {
    console.warn('⚠️ DATABASE_URL is not defined or is placeholder. Using in-memory fallback database.');
    return null;
  }

  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false // Safe default for serverless connections (e.g. Neon/Vercel)
      },
      connectionTimeoutMillis: 5000, // 5 second connection timeout
    });

    pool.on('error', (err) => {
      console.error('⚠️ Unexpected error on idle database client:', err.message);
      isDbHealthy = false;
    });

    return pool;
  } catch (error: any) {
    console.error('❌ Failed to initialize PostgreSQL Pool:', error.message);
    return null;
  }
}

// Check database table and create if needed
async function initializeDb() {
  const p = getDbPool();
  if (!p) {
    isDbHealthy = false;
    return;
  }

  try {
    // Perform simple query to verify connection
    await p.query('SELECT 1');
    
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        points INTEGER DEFAULT 100,
        total_earned INTEGER DEFAULT 100,
        click_power INTEGER DEFAULT 1,
        passive_income INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        clicks_count INTEGER DEFAULT 0,
        upgrades TEXT,
        transactions TEXT,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    isDbHealthy = true;
    console.log('✅ PostgreSQL database and "users" table checked successfully.');
  } catch (err: any) {
    console.error('❌ Error during PostgreSQL initialization:', err.message);
    isDbHealthy = false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize DB tables
  await initializeDb();

  // API 1: Health check & configuration status (with dynamic ping test)
  app.get('/api/status', async (req, res) => {
    const dbUrl = process.env.DATABASE_URL;
    const dbConfigured = !!dbUrl && !dbUrl.includes('user:password@host/dbname');
    
    let actualConnection = false;
    let errorMessage = null;

    if (dbConfigured) {
      const p = getDbPool();
      if (p) {
        try {
          // Verify actual client connection
          const client = await p.connect();
          try {
            await client.query('SELECT 1');
            actualConnection = true;
            isDbHealthy = true;
          } finally {
            client.release();
          }
        } catch (err: any) {
          console.error('⚠️ Live database connection check failed:', err.message);
          actualConnection = false;
          isDbHealthy = false;
          errorMessage = err.message;
        }
      }
    } else {
      isDbHealthy = false;
    }

    res.json({
      status: 'ok',
      databaseConfigured: dbConfigured,
      databaseConnected: actualConnection,
      errorMessage: errorMessage,
      mode: actualConnection 
        ? 'production (Neon/Vercel DB)' 
        : (dbConfigured 
            ? '연결 실패 (설정 오류)' 
            : 'sandbox (Local In-Memory Mode)')
    });
  });

  // API 2: Register a new account
  app.post('/api/auth/register', async (req: express.Request, res: express.Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
       res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해 주세요.' });
       return;
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
       res.status(400).json({ error: '아이디는 최소 3글자 이상이어야 합니다.' });
       return;
    }

    if (password.length < 4) {
       res.status(400).json({ error: '비밀번호는 최소 4글자 이상이어야 합니다.' });
       return;
    }

    const p = getDbPool();
    if (!p) {
      // In-Memory Mode fallback
      if (mockDb.users[trimmedUsername]) {
         res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
         return;
      }

      const newUser = {
        username: trimmedUsername,
        password,
        points: 100,
        total_earned: 100,
        click_power: 1,
        passive_income: 0,
        level: 1,
        experience: 0,
        clicks_count: 0,
        upgrades: JSON.stringify([]),
        transactions: JSON.stringify([{
          id: 'welcome_' + Date.now(),
          type: 'earn',
          amount: 100,
          description: '신규 가입 웰컴 포인트 보너스! (Sandbox)',
          timestamp: new Date().toISOString()
        }]),
        registered_at: new Date().toISOString()
      };

      mockDb.users[trimmedUsername] = newUser;
       res.status(201).json({
        message: '회원가입이 성공했습니다! (In-Memory Sandbox Mode)',
        user: { username: trimmedUsername, points: 100, level: 1 }
      });
      return;
    }

    // Neon DB Mode
    try {
      // Check if user already exists
      const existingUser = await p.query('SELECT username FROM users WHERE username = $1', [trimmedUsername]);
      if (existingUser.rows.length > 0) {
         res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
         return;
      }

      const initialTx = [{
        id: 'welcome_' + Date.now(),
        type: 'earn',
        amount: 100,
        description: '신규 가입 웰컴 포인트 보너스! (Neon DB)',
        timestamp: new Date().toISOString()
      }];

      await p.query(
        `INSERT INTO users (username, password, points, total_earned, click_power, passive_income, level, experience, clicks_count, upgrades, transactions) 
         VALUES ($1, $2, 100, 100, 1, 0, 1, 0, 0, $3, $4)`,
        [trimmedUsername, password, JSON.stringify([]), JSON.stringify(initialTx)]
      );

       res.status(201).json({
        message: '회원가입이 완료되었습니다!',
        user: { username: trimmedUsername, points: 100, level: 1 }
      });
    } catch (err: any) {
      console.error('Registration database error:', err);
      res.status(500).json({ 
        error: `데이터베이스(PostgreSQL) 연결 실패! 설정된 DATABASE_URL의 주소, 비밀번호, 또는 SSL 옵션에 오류가 없는지 검토해 주세요. (상세 오류: ${err.message})`
      });
    }
  });

  // API 3: Log in to an account
  app.post('/api/auth/login', async (req: express.Request, res: express.Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
       res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해 주세요.' });
       return;
    }

    const trimmedUsername = username.trim();
    const p = getDbPool();

    if (!p) {
      // In-Memory Mode fallback
      const user = mockDb.users[trimmedUsername];
      if (!user) {
         res.status(400).json({ error: '존재하지 않는 아이디입니다.' });
         return;
      }
      if (user.password !== password) {
         res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' });
         return;
      }

       res.json({
        message: '로그인 성공!',
        user: {
          username: user.username,
          points: user.points,
          totalEarned: user.total_earned,
          clickPower: user.click_power,
          passiveIncome: user.passive_income,
          level: user.level,
          experience: user.experience,
          clicksCount: user.clicks_count,
          upgrades: JSON.parse(user.upgrades),
          transactions: JSON.parse(user.transactions)
        }
      });
      return;
    }

    // Neon DB Mode
    try {
      const userResult = await p.query('SELECT * FROM users WHERE username = $1', [trimmedUsername]);
      if (userResult.rows.length === 0) {
         res.status(400).json({ error: '존재하지 않는 아이디입니다. 회원가입을 먼저 진행해 주세요.' });
         return;
      }

      const dbUser = userResult.rows[0];
      if (dbUser.password !== password) {
         res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' });
         return;
      }

       res.json({
        message: '로그인 성공!',
        user: {
          username: dbUser.username,
          points: dbUser.points,
          totalEarned: dbUser.total_earned,
          clickPower: dbUser.click_power,
          passiveIncome: dbUser.passive_income,
          level: dbUser.level,
          experience: dbUser.experience,
          clicksCount: dbUser.clicks_count,
          upgrades: dbUser.upgrades ? JSON.parse(dbUser.upgrades) : [],
          transactions: dbUser.transactions ? JSON.parse(dbUser.transactions) : []
        }
      });
    } catch (err: any) {
      console.error('Login database error:', err);
      res.status(500).json({ 
        error: `데이터베이스(PostgreSQL) 연결 실패! 설정된 DATABASE_URL의 주소, 비밀번호, 또는 SSL 옵션에 오류가 없는지 검토해 주세요. (상세 오류: ${err.message})`
      });
    }
  });

  // API 4: Sync / Save user progress
  app.post('/api/user/sync', async (req: express.Request, res: express.Response) => {
    const { username, points, totalEarned, clickPower, passiveIncome, level, experience, clicksCount, upgrades, transactions } = req.body;

    if (!username) {
       res.status(400).json({ error: '아이디 정보가 필요합니다.' });
       return;
    }

    const p = getDbPool();
    if (!p) {
      // In-Memory Mode fallback
      if (!mockDb.users[username]) {
         res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
         return;
      }

      mockDb.users[username] = {
        ...mockDb.users[username],
        points: points ?? mockDb.users[username].points,
        total_earned: totalEarned ?? mockDb.users[username].total_earned,
        click_power: clickPower ?? mockDb.users[username].click_power,
        passive_income: passiveIncome ?? mockDb.users[username].passive_income,
        level: level ?? mockDb.users[username].level,
        experience: experience ?? mockDb.users[username].experience,
        clicks_count: clicksCount ?? mockDb.users[username].clicks_count,
        upgrades: upgrades ? JSON.stringify(upgrades) : mockDb.users[username].upgrades,
        transactions: transactions ? JSON.stringify(transactions) : mockDb.users[username].transactions
      };

       res.json({ success: true, message: '진행 상황이 로컬 메모리에 동기화되었습니다.' });
      return;
    }

    // Neon DB Mode
    try {
      await p.query(
        `UPDATE users 
         SET points = $1, 
             total_earned = $2, 
             click_power = $3, 
             passive_income = $4, 
             level = $5, 
             experience = $6, 
             clicks_count = $7, 
             upgrades = $8, 
             transactions = $9
         WHERE username = $10`,
        [
          points,
          totalEarned,
          clickPower,
          passiveIncome,
          level,
          experience,
          clicksCount,
          JSON.stringify(upgrades || []),
          JSON.stringify(transactions || []),
          username
        ]
      );

       res.json({ success: true, message: '데이터베이스 동기화 완료!' });
    } catch (err: any) {
      console.error('Sync database error:', err);
       res.status(500).json({ error: '데이터를 데이터베이스에 동기화하지 못했습니다: ' + err.message });
    }
  });

  // API 5: Leaderboard compilation (combines DB users & virtual competitors)
  app.get('/api/leaderboard', async (req: express.Request, res: express.Response) => {
    const p = getDbPool();
    let realUsers: any[] = [];

    if (!p) {
      // Fallback in-memory leaderboard
      realUsers = Object.values(mockDb.users).map((u) => ({
        username: u.username,
        points: u.points,
        level: u.level
      }));
    } else {
      try {
        const result = await p.query('SELECT username, points, level FROM users ORDER BY points DESC LIMIT 30');
        realUsers = result.rows;
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      }
    }

    res.json({
      success: true,
      users: realUsers
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Point Accumulator server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
