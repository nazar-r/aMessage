import { useQueryClient, useMutation } from "@tanstack/react-query";
import { addUserAsContact } from "./add.user.as.contact"
import type { UserContact } from '../../types';

export const useAddUserAsContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userContactId }: UserContact) =>
      addUserAsContact(userContactId),

    onMutate: ({ userContactId }: UserContact) => {
      queryClient.setQueryData(["users"], (prevUsers: any[] = []) =>
        prevUsers.map((user) =>
          user.userId === userContactId
            ? { ...user, isContact: true }
            : user
        )
      );

      queryClient.setQueryData(["chats"], (prevChats: any[] = []) =>
        prevChats.map((chat) =>
          chat.userId === userContactId
            ? { ...chat, isContact: true }
            : chat
        )
      );
    },

    onError: (error) => {
      console.error(error);
    },
  });
};