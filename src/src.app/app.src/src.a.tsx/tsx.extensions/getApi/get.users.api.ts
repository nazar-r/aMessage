import type { ErrorResponse } from '../types';

export const fetchingUsers = async () => {
    const response = await fetch(import.meta.env.VITE_FETCH_USERS_URL, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw errorData;
    }

    const data = await response.json();
    console.log(data);
    return data;
};  