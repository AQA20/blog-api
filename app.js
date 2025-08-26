// app.js
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
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './config/swaggerDocs.js';

const app = express();

// Security middlewares
app.use(cookieParser(process.env.COOKIE_SECRET));
process.env.NODE_ENV !== 'development' && app.use(rateLimitConfig);
process.env.NODE_ENV !== 'development' && app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));

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
  const err = new ApiError(`Can't find ${req.originalUrl} on the server!`, 404);
  next(err);
});

// Global error handler
app.use(globalErrorHandler);

export default app;
