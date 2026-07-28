const { PrismaClient } = require('@prisma/client');
const { nodeEnv } = require('./env');

// Reuse a single PrismaClient instance across the app (and across hot
// reloads in dev) instead of creating a new connection pool per import.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
  });

if (nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
