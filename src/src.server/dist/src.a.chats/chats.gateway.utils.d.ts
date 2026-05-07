import type { JwtPayload } from '../src.extensions/extensions.types/types';
export type ChatMessage = {
    userId: string;
    messageId: string;
    content: string;
    createdAt: Date | string;
};
export declare const getUserId: (payload?: JwtPayload) => string;
export declare const getPeerId: (value: string | string[] | undefined) => string | null;
export declare const getRoomId: (userId: string, peerId: string) => string;
export declare const normalizePublicKey: (publicKey: string) => string;
export declare const mapMessage: (message: ChatMessage) => {
    userId: string;
    messageId: string;
    text: string;
    createdAt: string | Date;
};
