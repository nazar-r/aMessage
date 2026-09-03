import type { ErrorResponse, UsersData } from "../types";

export const fetchingGemini = async (): Promise<any[]> => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/search`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw errorData;
    }

    const data: UsersData[] = await response.json();
    console.log("fetchingGemini response:", data);
    return data;
};