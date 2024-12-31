import helmet from 'helmet';
// import crypto from 'crypto';

// Generate a random nonce value for each request
// const generateNonce = crypto.randomBytes(16).toString('base64');

const helmetConfig = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
});

export default helmetConfig;
