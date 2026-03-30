import type {ErrorResponse } from '../types';

export const fetchingNotes = async () => {
  const response = await fetch('http://localhost:3000/notes', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw errorData;
  }

  return response.json();
};  