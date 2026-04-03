import type { ErrorResponse } from '../types';

export const fetchingLoggedInUser = async () => {
    const response = await fetch('http://localhost:3001/auth/check', {
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