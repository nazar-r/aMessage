import type { notesData, ErrorResponse } from '../types';

export const pushingNotes = async (data: notesData) => {
  const response = await fetch('http://localhost:3000/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw errorData;
  }

  return response.json();
};