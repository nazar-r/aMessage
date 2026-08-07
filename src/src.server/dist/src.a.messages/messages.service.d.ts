import { PrismaService } from '../src.b.prisma/prisma.service';
export declare class MessagesService {
    private readonly usePrisma;
    constructor(usePrisma: PrismaService);
    createMessage(message: {
        roomId: string;
        userId: string;
        peerId: string;
        content: string;
    }): Promise<{
        roomId: string;
        messageId: string;
        userId: string;
        content: string;
        createdAt: Date;
    }>;
    updateMessage(message: {
        messageId: string;
        content: string;
    }): import("@prisma/client").Prisma.Prisma__MessageClient<{
        roomId: string;
        messageId: string;
        userId: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findMessagesByRoom(roomId: string, options?: {
        take?: number;
        cursor?: string;
    }): import("@prisma/client").Prisma.PrismaPromise<{
        messageId: string;
        userId: string;
        content: string;
        createdAt: Date;
    }[]>;
    removeMessage(messageId: string, userId: string): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Prisma.BatchPayload>;
    findMessages(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        roomId: string;
        messageId: string;
        userId: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findUserChats(userId: string): Promise<unknown>;
    deleteUserChat(userId: string, roomId: string): Promise<{
        roomId: string;
        createdAt: Date;
    }>;
}
