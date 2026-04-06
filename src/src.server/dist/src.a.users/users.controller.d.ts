import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findMessages(req: any): import("@prisma/client").Prisma.PrismaPromise<{
        userId: string;
        userName: string;
    }[]>;
}
