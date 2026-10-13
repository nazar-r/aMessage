import { PrismaService } from '../src.b.prisma/prisma.service';
import type { CreatedMessage, UpdatedMessage, MessageSearch } from '../src.extensions/extensions.types/types.chats';
export declare class MessagesService {
    private readonly usePrisma;
    constructor(usePrisma: PrismaService);
    createMessage(message: CreatedMessage): Promise<{
        roomId: string;
        messageId: string;
        userId: string;
        content: string;
        createdAt: Date;
    }>;
    updateMessage(message: UpdatedMessage): import("@prisma/client").Prisma.Prisma__MessageClient<{
        roomId: string;
        messageId: string;
        userId: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    removeMessage(messageId: string, userId: string): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Prisma.BatchPayload>;
    getMessagesByRoom(roomId: string, options?: MessageSearch): import("@prisma/client").Prisma.PrismaPromise<{
        messageId: string;
        userId: string;
        content: string;
        createdAt: Date;
    }[]>;
    getMessages(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        roomId: string;
        messageId: string;
        userId: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getUserChats(userId: string): import("@prisma/client").Prisma.PrismaPromise<unknown>;
    removeUserChat(roomId: string): Promise<{
        roomId: string;
        createdAt: Date;
    }>;
}
