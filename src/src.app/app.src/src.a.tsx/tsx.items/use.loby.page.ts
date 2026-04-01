import { useFetchingMessages } from '../tsx.extensions/getApi/use.get.messages.api';
import { useRemovingMessages } from '../tsx.extensions/setApi/use.remove.messages.api';
import { useCreatingMessage } from "../tsx.extensions/setApi/use.send.messages.api";
import { useUpdatingMessage } from "../tsx.extensions/setApi/use.update.messages.api";
import { useState, useEffect } from 'react';
import type { MessagesData } from '../tsx.extensions/types';

export const useLobbyPage = () => {
    const createMessageMutation = useCreatingMessage(() => setText(""));
    const updateMessageMutation = useUpdatingMessage();
    const removeMessageMutation = useRemovingMessages();
    const { data: messages = [] } = useFetchingMessages();
    const [localMessages, setLocalMessages] = useState<MessagesData[]>([]);
    const [defEdit, setEdit] = useState(false);
    const [text, setText] = useState("");

    useEffect(() => {
        setLocalMessages(messages);
    }, [messages]);

    const switchEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEdit(prev => !prev);
    };

    const saveMessage = (message: MessagesData) => {
        if (!message.content.trim()) return;

        message.messageId.startsWith("temp-") || message.messageId === ""
            ? createMessageMutation.mutate(
                { messageStatus: "mine", messageId: "", content: message.content },
                {
                    onSuccess: (createdMessage) => {
                        setLocalMessages(prev => prev.map(n => n.messageId === message.messageId ? createdMessage : n));
                    },
                }
            )
            : updateMessageMutation.mutate(
                { messageId: message.messageId, data: { ...message } },
                {
                    onSuccess: (updatedMessage) => {
                        setLocalMessages(prev => prev.map(n => n.messageId === message.messageId ? updatedMessage : n));
                    },
                }
            );
    };

    const createMessage = (context = text, contextStatus = setText) => {
        const newMessage: MessagesData = { messageStatus: "mine", messageId: "temp-" + crypto.randomUUID(), content: context };
        setLocalMessages(prev => [...prev, newMessage]);
        setText(`${contextStatus}`);
        saveMessage(newMessage)
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
        scroll,
        createMessage,
        saveMessage,
        deleteMessage,
        setLocalMessages
    };
};