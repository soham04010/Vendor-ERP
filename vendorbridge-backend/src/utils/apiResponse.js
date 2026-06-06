function apiResponse(success, message, data = null, error = null) {
  return {
    success,
    message,
    data,
    error
  };
}

module.exports = apiResponse;
