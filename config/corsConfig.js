const allowedOrigins = [
  'https://500kalima.site',
  'https://test.500kalima.site',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'https://www.500kalima.site',
  'https://admin.500kalima.site',
  'https://manage.500kalima.site',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  credentials: true,
  optionsSuccessStatus: 204,
};

export default corsOptions;
