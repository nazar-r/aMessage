import type { messagesData, ErrorResponse } from '../types';

export const updatingMessages = async (data: messagesData, messageId: string) => {
  const response = await fetch(`http://localhost:3001/messages/${messageId}`, {
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