import type { ErrorResponse } from '../types';

export const removingMessages = async (messageId: string) => {
  const response = await fetch(`https://api.amessage.site/messages/${messageId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw errorData;
  }

  return response.json();
};