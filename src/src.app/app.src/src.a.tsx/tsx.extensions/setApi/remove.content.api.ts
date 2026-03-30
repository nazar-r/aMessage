import type { ErrorResponse } from '../types';

export const removingNotes = async (noteId: string) => {
  const response = await fetch(`http://localhost:3000/notes/${noteId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw errorData;
  }

  return response.json();
};