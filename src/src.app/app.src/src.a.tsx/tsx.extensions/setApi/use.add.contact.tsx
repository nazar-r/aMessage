import { useQueryClient, useMutation } from "@tanstack/react-query";
import { addUserAsContact } from "./add.user.as.contact"

export const useAddUserAsContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addUserAsContact,

    onMutate: (newContact) => {
      queryClient.setQueryData(["users"], (prevUserContacts: any[] = []) =>
        prevUserContacts.map((user) =>
          user.userId === newContact.contactId
            ? { ...user, isContact: newContact.isContact }
            : user
        )
      );

      console.log(newContact);
    },

    onError: (error) => {
      console.error(error);
    },
  });
};