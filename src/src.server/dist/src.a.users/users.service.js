"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let UsersService = class UsersService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async findAllUsers(userId) {
        const [users, contacts] = await Promise.all([
            this.prisma.user.findMany({
                where: {
                    userId: { not: userId },
                },
                orderBy: {
                    userName: 'desc',
                },
                select: {
                    userId: true,
                    userName: true,
                },
            }),
            this.prisma.contact.findMany({
                where: { userId },
                select: { contactId: true },
            }),
        ]);
        const contactsArray = new Set(contacts.map(c => c.contactId));
        return users.map(usersArray => ({
            ...usersArray,
            isContact: contactsArray.has(usersArray.userId),
        }));
    }
    setUserContact(usersContact) {
        return this.prisma.contact.upsert({
            where: {
                userId_contactId: {
                    userId: usersContact.userId,
                    contactId: usersContact.contactId,
                },
            },
            update: {},
            create: {
                userId: usersContact.userId,
                contactId: usersContact.contactId,
            },
        });
    }
    async findOrCreateUser(profile) {
        if (!profile.userId) {
            throw new common_1.UnauthorizedException({
                message: 'ID is missing in your Service profile',
                error: 'Unauthorized',
            });
        }
        if (!profile.email) {
            throw new common_1.UnauthorizedException({
                message: 'Email is missing in your Service profile',
                error: 'Unauthorized',
            });
        }
        const user = await this.prisma.user.upsert({
            where: { email: profile.email },
            update: {
                userName: profile.name || 'Unknown',
                userId: profile.userId,
            },
            create: {
                email: profile.email,
                userId: profile.userId,
                userName: profile.name || 'Unknown',
            },
        });
        return {
            ...user,
            name: user.userName,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map