import express from 'express';
import userRoutes from './routes/userRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import articleTagRoutes from './routes/articleTagRoutes.js';
import sitemapRoutes from './routes/sitemapRoutes.js';
import globalErrorHandler from './middleware/globalErrorHandler.js';
import ApiError from './services/ApiError.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import corsOptions from './config/corsConfig.js';
import helmetConfig from './config/helmetConfig.js';
import rateLimitConfig from './config/rateLimitConfig.js';
import swaggerUi from 'swagger-ui-express'
import swaggerDocs from './config/swaggerDocs.js';

// Todo implement unit & integration tests

// Handle uncaughtException Exceptions
process.on('uncaughtException', (err) => {
  console.error(err);
  console.log('Uncaught exception has occurred! Shutting down...');
  //Shut down the Node application
  process.exit(1);
});

const PORT = process.env.PORT || 8080;

const app = express();

// Security middlewares
app.use(cookieParser(process.env.COOKIE_SECRET)); // Use cookie-parser middleware
process.env.NODE_ENV !== 'development' && app.use(rateLimitConfig);
process.env.NODE_ENV !== 'development' && app.use(helmet(helmetConfig)); // Use helmet middleware to prevent some well-known web vulnerabilities.
app.use(cors(corsOptions)); // Use the configured CORS middleware
app.use(express.json({ limit: '5mb' })); // A middleware to parse JSON payloads

const nodeApiRoute = '/node-api';

// Register routers
app.use(nodeApiRoute, userRoutes);
app.use(nodeApiRoute, articleRoutes);
app.use(nodeApiRoute, imageRoutes);
app.use(nodeApiRoute, categoryRoutes);
app.use(nodeApiRoute, tagRoutes);
app.use(nodeApiRoute, articleTagRoutes);
app.use(nodeApiRoute, sitemapRoutes);

// Serve swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Handle not found routes
app.all('*', (req, res, next) => {
  // Create new api error
  const err = new ApiError(`Can't find ${req.originalUrl} on the server!`, 404);
  next(err);
});

// Error handling middleware (Note that it's
// placed under all other routes and middlewares
// as express run middlewares by order)
app.use(globalErrorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running at ${process.env.NEXT_JS_URL}${nodeApiRoute}`);
  console.log(`API Documentation available at ${process.env.NEXT_JS_URL}/api-docs`);
});

// Catch unhandled Promise rejections
process.on('unhandledRejection', (err) => {
  console.error(err);
  // Avoid immediately aborting current requests which are still running or pending
  // So we only shutdown the node app after the server is closed.
  server.close(() => {
    console.log('Unhandled rejection has occurred! Shutting down...');
    //Shut down the Node application
    process.exit(1);
  });
});
