import type { ErrorResponse, UsersData } from "../types";

export const fetchingUsers = async (): Promise<UsersData[]> => {
    const response = await fetch(import.meta.env.VITE_FETCH_USERS_URL, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw errorData;
    }

    const data: UsersData[] = await response.json();
    console.log(data)
    return data;
};