import type { ErrorResponse } from '../../src.c.extensions/extentions.types/types';

export const sendSearchMessage = async (prompt: string) => {
  const content = prompt;
  const request = await fetch(`${import.meta.env.VITE_BACKEND_URL}/search`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }
  );

  if (!request.ok) {
    const errorData: ErrorResponse = await request.json();
    throw errorData;
  }

  return request.json();
};