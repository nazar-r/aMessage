import type { ErrorResponse } from '../types';

export const addUserAsContact = async (newContact: any) => {
    const response = await fetch(import.meta.env.VITE_SET_CONTACTS_URL, {
        method: "POST",
        credentials: 'include',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(newContact),
        
    });
    
    if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw errorData;
    }
    
    return response.json();
};