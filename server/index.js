// server/index.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { BotManager } from './engine/BotManager.js';
import { createApiRouter } from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function bootstrap() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const HOST = '0.0.0.0';

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Trading Bot Manager Engine
  const botManager = new BotManager();

  // Mount API endpoints
  app.use('/api', createApiRouter(botManager));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      botStatus: botManager.status,
      timestamp: Date.now()
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      root: rootDir,
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        allowedHosts: true
      },
      appType: 'spa'
    });

    app.use(vite.middlewares);
  } else {
    // Production static serve
    app.use(express.static(path.resolve(rootDir, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(rootDir, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Trading Bot & Web Dashboard Server Aktif!`);
    console.log(`📡 URL Preview: http://${HOST}:${PORT}`);
    console.log(`⚡ Mode: ${botManager.mode.toUpperCase()} | Status Bot: ${botManager.status}`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down trading bot server...');
    botManager.simulator.stop();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
