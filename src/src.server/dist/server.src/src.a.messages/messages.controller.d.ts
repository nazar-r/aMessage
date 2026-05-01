import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    findMessagesByRoom(req: any): import("@prisma/client").Prisma.PrismaPromise<{
        messageId: string;
        userId: string;
        content: string;
        createdAt: Date;
    }[]>;
}
