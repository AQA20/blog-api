/**
 * Sends a standardized JSON response to the client with a specified status code and data.
 *
 * This function constructs a JSON response object that includes the status of the request, the status code,
 * and any data to be returned to the client. It ensures that the response structure is consistent across the API.
 *
 * @param {number} statusCode - The HTTP status code for the response (e.g., 200 for success, 404 for not found).
 * @param {object} data - The data to include in the response body. This can be any object (e.g., response payload, message).
 * @param {object} res - The Express.js response object used to send the response to the client.
 *
 * @returns {object} The response object containing the status, status code, and data.
 *
 * @example
 * handleResponse(200, { user: { id: 1, name: 'John Doe' } }, res);
 * // Responds with a JSON object: { status: 'success', statusCode: 200, data: { user: {...} } }
 */
const handleResponse = (statusCode, data, res) => {
  return res.status(statusCode).json({
    status: 'success', // Indicates the success of the request
    statusCode, // The HTTP status code of the response
    data, // The data to return to the client
  });
};

export default handleResponse;
