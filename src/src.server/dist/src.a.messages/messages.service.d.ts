import { PrismaService } from '../src.b.prisma/prisma.service';
import { MessageDTO } from './messages.image/messages.create.dto';
export declare class MessagesService {
    private readonly usePrisma;
    constructor(usePrisma: PrismaService);
    createMessage(message: MessageDTO): import("@prisma/client").Prisma.Prisma__MessageClient<{
        messageId: string;
        content: string;
        createdAt: Date;
        roomId: string;
        userId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    updateMessage(message: {
        messageId: string;
        content: string;
    }): import("@prisma/client").Prisma.Prisma__MessageClient<{
        messageId: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        roomId: string;
        userId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findMessagesByRoom(roomId: string, options?: {
        take?: number;
        cursor?: string;
    }): import("@prisma/client").Prisma.PrismaPromise<{
        messageId: string;
        content: string;
        createdAt: Date;
        userId: string;
    }[]>;
    removeMessage(messageId: string, userId: string): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Prisma.BatchPayload>;
    findMessages(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        messageId: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        roomId: string;
        userId: string;
    }[]>;
    findUserChats(userId: string): Promise<unknown>;
    deleteUserChat(userId: string, roomId: string): import("@prisma/client").Prisma.Prisma__RoomClient<{
        createdAt: Date;
        roomId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
