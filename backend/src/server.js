const app = require('./app');
const { port, nodeEnv } = require('./config/env');
const prisma = require('./config/db');
const { startSchedulers, stopSchedulers } = require('./jobs/scheduler');

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] University System API running on port ${port} (${nodeEnv})`);
  startSchedulers();
});

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`[server] Received ${signal}, shutting down gracefully...`);
  stopSchedulers();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
