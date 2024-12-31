export default class ApiError extends Error {
  constructor(message, statusCode) {
    // Call the constructor of extended class
    super(message);
    // Set the statusCode property
    this.statusCode = statusCode;
    // Explicitly Assign the error message
    this.message = message;
    // Determine whether it's a client error or server error
    this.status = statusCode >= 500 ? 'error' : 'failed';
    // This error class will only be used for operational errors
    this.isOperational = true;
    // Capture the stack trace to know where the error has occurred
    Error.captureStackTrace(this, this.constructor);
  }
}
