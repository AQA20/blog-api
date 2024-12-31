const devError = (res, err) => {
  return res.status(err.statusCode).json({
    status: err.status,
    statusCode: err.statusCode,
    message: err.message,
    trace: err.stack,
  });
};

const prodError = (res, err) => {
  // Check if the error is related to application operation
  // such as invalid user input, database connection errors, file system errors, etc
  if (
    err?.isOperational ||
    err?.name === 'ValidationError' ||
    err?.name === 'JsonWebTokenError'
  ) {
    return res.status(err.statusCode).json({
      status: err.status,
      statusCode: err.statusCode,
      message: err.message,
    });
  }
  // If programming error send a generic error message
  res.status(err.statusCode).json({
    status: 'failed',
    statusCode: 500,
    message: 'Something went wrong!',
  });
};

const globalErrorHandler = async (err, req, res, next) => {
  //todo add error login service use aws & logger like winston
  let statusCode = err?.statusCode || 500;
  switch (err.name) {
    case 'JsonWebTokenError':
      statusCode = 401;
      break;
    case 'ValidationError':
      statusCode = 400;
      break;
    default:
      statusCode;
      break;
  }

  err.statusCode = statusCode;
  err.status = err?.status || 'error';
  // Return a detailed error when in development environment!
  if (process.env.NODE_ENV === 'development') {
    devError(res, err);
  } else {
    // Don't leak too much information about the error in other environments (production, testing...etc)
    prodError(res, err);
  }

  next(err);
};

export default globalErrorHandler;
