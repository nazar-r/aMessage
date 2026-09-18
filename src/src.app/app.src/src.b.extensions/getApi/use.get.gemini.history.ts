import { useQuery } from "@tanstack/react-query";
import { fetchingGemini } from "./get.gemini.history";
import type { ErrorResponse } from "../types";

export const useGeminiMessages = () => {
    return useQuery<any, ErrorResponse>({
        queryKey: ["geminiMessages"],
        queryFn: fetchingGemini,
        staleTime: 1000 * 1,
        gcTime: 1000 * 60 * 60,
        retry: 1,
    });
};