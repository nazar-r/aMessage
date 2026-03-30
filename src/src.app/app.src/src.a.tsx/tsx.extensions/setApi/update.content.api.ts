import type { notesData, ErrorResponse } from '../types';

export const updatingNotes = async (data: notesData, noteId: string) => {
  const response = await fetch(`http://localhost:3000/notes/${noteId}`, {
    method: 'PATCH',
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