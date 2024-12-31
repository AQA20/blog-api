require('dotenv').config(); // Load .env file

module.exports = {
  apps: [
    {
      name: process.env.PM2_NAME || 'server-dev',
      script: 'npm start',
      // Add error handling and restart options
      max_restarts: 5,
      min_uptime: '60s',
      max_memory_restart: '1G',
      
      // Add clustering for better performance
      instances: 'max',
      exec_mode: 'cluster',
      
      // Group environment variables by purpose
      env: {
        // Server Configuration
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        SERVER_IP: process.env.SERVER_IP,
        
        // Database Configuration
        DB_USERNAME: process.env.DB_USERNAME,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_ROOT_PASSWORD: process.env.DB_ROOT_PASSWORD,
        DB_NAME: process.env.DB_NAME,
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        
        // SSL Configuration
        MYSQL_SSL_CA: process.env.MYSQL_SSL_CA,
        MYSQL_SSL_CERT: process.env.MYSQL_SSL_CERT,
        MYSQL_SSL_KEY: process.env.MYSQL_SSL_KEY,
        
        // AWS Configuration
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        AWS_FILE_BUCKET: process.env.AWS_FILE_BUCKET,
        AWS_REGION: process.env.AWS_REGION,
        
        // Security Configuration
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        SALT_ROUNDS: process.env.SALT_ROUNDS,
        COOKIE_SECRET: process.env.COOKIE_SECRET,
        
        // CloudFront Configuration
        CLOUDFRONT_KEY_PAIR_ID: process.env.CLOUDFRONT_KEY_PAIR_ID,
        CLOUDFRONT_PRIVATE_KEY: process.env.CLOUDFRONT_PRIVATE_KEY,
        
        // Application Configuration
        REVALIDATION_SECRET: process.env.REVALIDATION_SECRET,
        NEXT_JS_API_URL: process.env.NEXT_JS_API_URL,
        NEXT_JS_URL: process.env.NEXT_JS_URL,
        USERS: process.env.USERS,
      },
      
      // Add health monitoring
      watch: false,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};
