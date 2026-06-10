import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    findMessagesByRoom(req: any): import("@prisma/client").Prisma.PrismaPromise<{
        userId: string;
        createdAt: Date;
        messageId: string;
        content: string;
    }[]>;
}
