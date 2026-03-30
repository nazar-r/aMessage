import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pushingNotes } from "./send.content.api";
import type { notesData, ContextType } from "../types";

export const useCreatingNote = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation<any, unknown, notesData, ContextType>({
        mutationFn: (data: notesData) => pushingNotes(data),

        onMutate: async (newNote) => {
            await queryClient.cancelQueries({ queryKey: ["notes"] });

            const prev = queryClient.getQueryData(["notes"]);

            queryClient.setQueryData(["notes"], (old: any) => [
                ...(old || []),
                {
                    noteId: `temp-${Date.now()}`,
                    content: newNote.content,
                }
            ]);

            return { prev };
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes"] });
            if (onSuccessCallback) onSuccessCallback();
        },
    });
};