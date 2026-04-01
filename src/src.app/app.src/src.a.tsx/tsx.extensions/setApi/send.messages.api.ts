import type { MessagesData, ErrorResponse } from '../types';

export const pushingMessages = async (data: MessagesData) => {
  const response = await fetch('http://localhost:3001/messages', {
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