import { useFetchingMessages } from '../tsx.extensions/getApi/use.get.messages.api';
import { useRemovingMessages } from '../tsx.extensions/setApi/use.remove.messages.api';
import { useCreatingMessage } from "../tsx.extensions/setApi/use.send.messages.api";
import { useUpdatingMessage } from "../tsx.extensions/setApi/use.update.messages.api";
import { useRef, useState, useEffect } from 'react';
import type { messagesData } from '../tsx.extensions/types';

export const useLobbyPage = () => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const createMessageMutation = useCreatingMessage(() => setText(""));
    const updateMessageMutation = useUpdatingMessage();

    const removeMessageMutation = useRemovingMessages();
    const { data: messages = [] } = useFetchingMessages();
    const [localMessages, setLocalMessages] = useState<messagesData[]>([]);

    useEffect(() => {
        setLocalMessages(messages);
    }, [messages]);

    const [defEdit, setEdit] = useState(false);
    const [text, setText] = useState("");

    const switchEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEdit(prev => !prev);
    };

    const createMessage = () => {
        const newMessage: messagesData = {messageStatus: "mine", messageId: "temp-" + crypto.randomUUID(), content: "" };
        setLocalMessages(prev => [...prev, newMessage]);
        setText("");
    };

    const saveMessage = (message: messagesData) => {
        if (!message.content.trim()) return;

        message.messageId.startsWith("temp-") || message.messageId === ""
            ? createMessageMutation.mutate(
                {messageStatus: "mine", messageId: "", content: message.content },
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

    const deleteMessage = (messageId: string) => {
        const element = document.getElementById(messageId);
        element?.classList.add("lobby-message--fade");
        setTimeout(() => {
            removeMessageMutation.mutate(messageId);
            setLocalMessages(prev => prev.filter(message => message.messageId !== messageId));
        }, 200);
    };

    return {
        viewportRef,
        trackRef,
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