import { useQuery } from '@tanstack/react-query';

export const authentication = () =>
    useQuery({
        queryKey: ["auth"],
        queryFn: async () => {
            const res = await fetch("https://amessage-bi0d.onrender.com/auth/check", { credentials: "include" });
            return (await res.json()).user;
        },
        retry: 1,
        staleTime: 5 * 60 * 1000,
    });