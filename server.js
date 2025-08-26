// server.js
import app from './app.js';

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(err);
  console.log('Uncaught exception has occurred! Shutting down...');
  process.exit(1);
});

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`Server running at ${process.env.NEXT_JS_URL}/node-api`);
  console.log(`API Documentation available at ${process.env.NEXT_JS_URL}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(err);
  server.close(() => {
    console.log('Unhandled rejection has occurred! Shutting down...');
    process.exit(1);
  });
});
