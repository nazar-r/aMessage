import { PrismaService } from '../src.b.prisma/prisma.service';
export declare class MessagesService {
    private readonly usePrisma;
    constructor(usePrisma: PrismaService);
    createMessage(message: {
        messageId: string;
        roomId: string;
        userId: string;
        peerId: string;
        content: string;
    }): Promise<{
        userId: string;
        createdAt: Date;
        roomId: string;
        messageId: string;
        content: string;
    }>;
    updateMessage(message: {
        messageId: string;
        content: string;
    }): import("@prisma/client").Prisma.Prisma__MessageClient<{
        userId: string;
        createdAt: Date;
        roomId: string;
        messageId: string;
        content: string;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findMessagesByRoom(roomId: string, options?: {
        take?: number;
        cursor?: string;
    }): import("@prisma/client").Prisma.PrismaPromise<{
        userId: string;
        createdAt: Date;
        messageId: string;
        content: string;
    }[]>;
    removeMessage(messageId: string, userId: string): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Prisma.BatchPayload>;
    findMessages(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        userId: string;
        createdAt: Date;
        roomId: string;
        messageId: string;
        content: string;
        updatedAt: Date;
    }[]>;
    findUserChats(userId: string): Promise<unknown>;
    deleteUserChat(userId: string, roomId: string): Promise<{
        createdAt: Date;
        roomId: string;
    }>;
}
