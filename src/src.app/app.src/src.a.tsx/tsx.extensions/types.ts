export interface MessagesData {
    messageStatus: string;
    messageId: string;
    content: string;
}

export interface GivenMessagesData {
    messageId: string;
    content: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
};

export interface SharedTextContextType {
    text: string;
    setText: (value: string) => void;
}

export type AuthToken = {
    token: string
};

export type ContextType = {
    prev: any;
};

export type ErrorResponse = {
    message: string | string[];
    error?: string;
};

export type ButtonConfig = {
    key: string;
    label: string;
    icon: React.ComponentType;
}