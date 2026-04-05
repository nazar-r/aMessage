import { useRemovingMessages } from '../tsx.extensions/setApi/use.remove.messages.api';
import { useState} from 'react';
import type { MessagesData } from '../tsx.extensions/types';

export const useLobbyPage = () => {
    const removeMessageMutation = useRemovingMessages();
    const [localMessages, setLocalMessages] = useState<MessagesData[]>([]);
    const [defEdit, setEdit] = useState(false);
    const [text, setText] = useState("");

    const switchEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEdit(prev => !prev);
    };

    const deleteMessage = (messageId: string) => {
        const element = document.getElementById(messageId);
        element?.classList.add("chat-message--fade");
        setTimeout(() => {
            removeMessageMutation.mutate(messageId);
            setLocalMessages(prev => prev.filter(message => message.messageId !== messageId));
        }, 200);
    };

    return {
        localMessages,
        defEdit,
        text,
        switchEdit,
        deleteMessage,
        setLocalMessages
    };
};