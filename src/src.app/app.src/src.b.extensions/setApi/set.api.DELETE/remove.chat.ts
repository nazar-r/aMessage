import type { ErrorResponse } from '../../types';

export const removeUserChat = async (chatId: string) => {
    const request = await fetch(`${import.meta.env.VITE_FETCH_CHATS_URL}/${chatId}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    if (!request.ok) {
        const errorData: ErrorResponse = await request.json();
        throw errorData;
    };
};