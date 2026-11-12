import { JwtCheck } from '../src.b.jwt/jwt.extractor';
import { UsersService } from './users.service';
import { Controller, Param, Get, Delete, Body, Patch, UseGuards, Req } from '@nestjs/common';
import type { UserContact, userPubKey } from "../src.c.extensions/extensions.types/types.chats"
import type { TBody, TReq } from '../src.c.extensions/extensions.types/types.auth';

@Controller('users')
@UseGuards(JwtCheck)
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    loadUsers(@Req() req: TReq) {
        const userId = req.user.sub;
        return this.usersService.getAllUsers(userId);
    };

    @Patch('e2ee-pubkey')
    setKey(@Req() req) {
        const userId = req.user.sub;
        const userPubKey = req.body.publicKey;

        return this.usersService.setUserPubKey(userId, userPubKey);
    }
    
    @Patch('contacts/:id')
    setUserContact(@Req() req: any, @Param('id') contactId: string) {
        const userContact: UserContact = {
            userId: req.user.sub,
            contactId: contactId,
        };

        return this.usersService.setUserContact(userContact);
    };

    @Delete('contacts/:id')
    deleteUserContact(@Req() req: TReq, @Param('id') contactId: string) {
        const userContact: UserContact = {
            userId: req.user.sub,
            contactId: contactId,
        };

        return this.usersService.deleteUserContact(userContact);
    }
} 