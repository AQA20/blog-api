const handleAsyncError = (func) => {
  return async (...args) => {
    try {
      return await func(...args);
    } catch (error) {
      console.error('Caught an error in handleAsyncError:', error);
      throw error;
    }
  };
};

const handleAsyncApiError = (func) => {
  return async (req, res, next) => {
    try {
      return await func(req, res, next);
    } catch (error) {
      console.error('Caught an error in handleAsyncApiError:', error);
      next(error);
    }
  };
};

export { handleAsyncError, handleAsyncApiError };
