import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    findUserChats(req: any): Promise<unknown>;
    deleteUserChat(req: any): Promise<{
        createdAt: Date;
        roomId: string;
    }>;
}
