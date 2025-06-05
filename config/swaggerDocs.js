import swaggerJsdoc from 'swagger-jsdoc';
import combinedSpec from '../swagger-docs/index.js';

const options = {
  definition: combinedSpec,
  apis: ['./routes/**/*.js'], // Include route files if they also contain JSDoc comments
};

// Initialize swagger-jsdoc
const swaggerDocs = swaggerJsdoc(options);

export default swaggerDocs;