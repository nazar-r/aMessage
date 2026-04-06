import type { ErrorResponse } from '../types';

export const removingMessages = async (messageId: string) => {
  const response = await fetch(`https://amessage-bi0d.onrender.com/messages/${messageId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw errorData;
  }

  return response.json();
};