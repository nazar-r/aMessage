import type { ErrorResponse } from '../../types';

export const removeUserContact = async (userContactId: string) => {
    const request = await fetch(`${import.meta.env.VITE_SET_CONTACTS_URL}/${userContactId}`,
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