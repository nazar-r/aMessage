import type { JwtPayload } from '../src.extensions/extensions.types/types';
export type ChatSocketData = {
    user?: JwtPayload;
    roomId?: string;
    e2eePublicKey?: string;
};
export type MessageEventPayload = {
    text: string;
    from?: string;
};
export type UpdateMessagePayload = {
    messageId: string;
    text: string;
};
export type RemoveMessagePayload = {
    messageId: string;
};
