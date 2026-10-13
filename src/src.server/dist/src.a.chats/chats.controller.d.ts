import { ChatsService } from './chats.service';
export declare class ChatsController {
    private readonly chatsService;
    constructor(chatsService: ChatsService);
    findUserChats(req: any): import("@prisma/client").Prisma.PrismaPromise<unknown>;
    deleteUserChat(req: any): Promise<{
        roomId: string;
        createdAt: Date;
    }>;
}
