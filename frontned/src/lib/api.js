// Simple fetch wrapper to automatically handle headers and JSON response
const API_URL = 'http://localhost:5000/api';

export const api = async (endpoint, options = {}) => {
  const token = localStorage.getItem('autobi_token');
  const headers = {
    ...options.headers,
  };

  // Only default to JSON if we aren't sending FormData (e.g. file uploads)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw {
      status: response.status,
      message: data?.error || 'An error occurred',
    };
  }

  return data;
};
