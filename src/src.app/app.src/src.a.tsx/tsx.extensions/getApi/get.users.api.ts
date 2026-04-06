import type { ErrorResponse } from '../types';

export const fetchingUsers = async () => {
    const response = await fetch('https://amessage-bi0d.onrender.com/users', {
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