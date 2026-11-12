import { ChatsService } from './chats.service';
import type { TReq } from '../src.c.extensions/extensions.types/types.auth';
export declare class ChatsController {
    private readonly chatsService;
    constructor(chatsService: ChatsService);
    findUserChats(req: TReq): import("@prisma/client").Prisma.PrismaPromise<unknown>;
    deleteUserChat(req: TReq): Promise<{
        createdAt: Date;
        roomId: string;
    }>;
}
