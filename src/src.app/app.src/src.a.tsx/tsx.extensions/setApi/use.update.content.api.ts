import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatingNotes } from "./update.content.api";
import type { notesData, ContextType } from "../types";

export const useUpdatingNote = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation<any, unknown, { noteId: string; data: notesData }, ContextType>({
        mutationFn: ({ noteId, data }) => updatingNotes(data, noteId),

        onMutate: async ({ noteId, data }) => {
            await queryClient.cancelQueries({ queryKey: ["notes"] });

            const prev = queryClient.getQueryData<notesData[]>(["notes"]);

            queryClient.setQueryData<notesData[]>(["notes"], (old) =>
                old?.map(note => note.noteId === noteId ? { ...note, content: data.content } : note) || []
            );

            return { prev };
        },

        onError: (_err, _variables, context) => {
            if (context?.prev) {
                queryClient.setQueryData(["notes"], context.prev);
            }
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes"] });
            if (onSuccessCallback) onSuccessCallback();
        },
    });
};