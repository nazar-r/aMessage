import { MessageDTO } from './messages.image/messages.create.dto';
export declare class MessagesService {
    private prisma;
    create(messageImage: MessageDTO): Promise<{
        userId: string;
        createdAt: Date;
        roomId: string;
        messageId: string;
        content: string;
    }>;
    update(message: {
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
    findMessages(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        userId: string;
        createdAt: Date;
        roomId: string;
        messageId: string;
        content: string;
        updatedAt: Date;
    }[]>;
    remove(messageId: string, userId: string): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Prisma.BatchPayload>;
}
