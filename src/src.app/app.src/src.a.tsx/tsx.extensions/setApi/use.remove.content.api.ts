import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removingNotes } from "./remove.content.api";

export const useRemovingNotes = (onSuccessCallback?: (noteId: string) => void) => {
    const queryClient = useQueryClient();

    return useMutation<unknown, unknown, string>({
        mutationFn: (noteId: string) => removingNotes(noteId),

        onMutate: async (noteId) => {
            await queryClient.cancelQueries({ queryKey: ["notes"] });
            const prev = queryClient.getQueryData(["notes"]);

            queryClient.setQueryData(["notes"], (old: any) =>
                (old || []).filter((note: any) => note.noteId !== noteId)
            );

            return { prev };
        },

        onSuccess: (_data, noteId) => {
            queryClient.invalidateQueries({ queryKey: ["notes"] });
            if (onSuccessCallback) onSuccessCallback(noteId);
        },
    });
};