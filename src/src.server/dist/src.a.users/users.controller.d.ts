import { UsersService } from './users.service';
import type { SetUserContactDTO } from "../src.extensions/extensions.types/types";
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findMessages(req: any): Promise<{
        isContact: boolean;
        userId: string;
        userName: string;
    }[]>;
    setUserContact(req: any, newContact: SetUserContactDTO): import("@prisma/client").Prisma.Prisma__ContactClient<{
        userId: string;
        createdAt: Date;
        contactId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
