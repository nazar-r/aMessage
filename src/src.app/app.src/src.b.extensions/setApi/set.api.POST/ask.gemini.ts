import type { ErrorResponse } from '../../types';

export const sendSearchMessage = async (prompt: string) => {
  const request = await fetch(`${import.meta.env.VITE_BACKEND_URL}/search`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }
  );

  if (!request.ok) {
    const errorData: ErrorResponse = await request.json();
    throw errorData;
  }

  return request.json();
};