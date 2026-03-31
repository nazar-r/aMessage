import type {ErrorResponse } from '../types';

export const fetchingMessages = async () => {
  const response = await fetch('http://localhost:3001/messages', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw errorData;
  }

  return response.json();
};  