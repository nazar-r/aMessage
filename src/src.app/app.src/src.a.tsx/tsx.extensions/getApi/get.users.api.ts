import type { ErrorResponse } from '../types';

export const fetchingUsers = async () => {
    const response = await fetch('http://localhost:3001/users', {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw errorData;
    }

    const data = await response.json();
    console.log(data); // тут уже справжні дані
    return data;
};  