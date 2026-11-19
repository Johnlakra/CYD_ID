// Turns an axios error into one readable sentence, including the backend's field errors
// (`errors: [...]`) instead of only "Validation failed".
export const apiErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  const data = err?.response?.data;
  if (data) {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.join('. ');
    }
    if (data.message) return data.message;
  }
  if (err?.request && !err?.response) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  return fallback;
};

export default apiErrorMessage;
