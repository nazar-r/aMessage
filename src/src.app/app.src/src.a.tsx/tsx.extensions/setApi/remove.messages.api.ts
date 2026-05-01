import type { ErrorResponse } from '../types';

export const removingMessages = async (messageId: string) => {
  const response = await fetch(`${import.meta.env.VITE_FETCH_MESSAGES_URL}/${messageId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw errorData;
  }

  return response.json();
};