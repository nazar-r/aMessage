import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    findUserChats(req: any): Promise<unknown>;
    deleteUserChat(req: any): import("@prisma/client").Prisma.Prisma__RoomClient<{
        createdAt: Date;
        roomId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
