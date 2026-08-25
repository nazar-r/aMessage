import { useQueryClient, useMutation } from "@tanstack/react-query";
import { removeUserContact } from "./remove.contact"
import type { UserContact } from '../../types';

export const useRemoveUserContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userContactId }: UserContact) =>
      removeUserContact(userContactId),

    onMutate: ({ userContactId }: UserContact) => {
      queryClient.setQueryData(["users"], (prevUsers: any[] = []) =>
        prevUsers.map((user) =>
          user.userId === userContactId
            ? { ...user, isContact: false }
            : user
        )
      );

      queryClient.setQueryData(["chats"], (prevChats: any[] = []) =>
        prevChats.map((chat) =>
          chat.userId === userContactId
            ? { ...chat, isContact: false }
            : chat
        )
      );
    },

    onError: (error) => {
      console.error(error);
    },
  });
};