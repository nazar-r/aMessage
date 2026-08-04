import type { ErrorResponse } from '../types';

export const fetchingUserChats = async () => {
    const response = await fetch(import.meta.env.VITE_FETCH_CHATS_URL, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw errorData;
    }

    
    
    const data = await response.json();
    console.log("FETCHING USER CHATS RESPONSE:", JSON.stringify(data, null, 2));
    return data;
};  