import { useQuery } from '@tanstack/react-query';

export const authentication = () =>
    useQuery({
        queryKey: ["auth"],
        queryFn: async () => {
            const res = await fetch(import.meta.env.VITE_AUTH_CHECK_URL, { credentials: "include" });
            return (await res.json()).user;
        },
        retry: 1,
        staleTime: 5 * 60 * 1000,
    });