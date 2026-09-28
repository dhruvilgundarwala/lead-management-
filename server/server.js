const env = require('./config/env');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { seedDemoUsers } = require('./config/seed');

const start = async () => {
  await connectDB();
  if (env.seedDemoUsers) await seedDemoUsers();

  const server = app.listen(env.PORT, () => {
    console.log(`[server] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Force exit if connections don't drain in time.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
  process.exit(1);
});

start().catch((err) => {
  console.error('[server] Failed to start:', err.message);
  process.exit(1);
});
