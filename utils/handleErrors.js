import logger from "../config/winstonConfig.js";

const handleAsyncError = (func) => {
  return async (...args) => {
    try {
      return await func(...args);
    } catch (err) {
      logger.error(JSON.stringify({
        status: err.status,
        statusCode: err.statusCode,
        message: `Caught an error in handleAsyncError: ${err.message}`,
        trace: err.stack,
      }))
      throw err;
    }
  };
};

const handleAsyncApiError = (func) => {
  return async (req, res, next) => {
    try {
      return await func(req, res, next);
    } catch (err) {
      logger.error(JSON.stringify({
        status: err.status,
        statusCode: err.statusCode,
        message: `handleAsyncApiError: ${err.message}`,
        trace: err.stack,
      }))
      next(err);
    }
  };
};

export { handleAsyncError, handleAsyncApiError };
