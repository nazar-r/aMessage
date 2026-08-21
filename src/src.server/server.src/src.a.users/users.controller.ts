import { Controller, Param, Get, Delete, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtCheck } from '../src.b.jwt/jwt.extractor';
import type { UserContact } from "../src.extensions/extensions.types/types"

@Controller('users')
@UseGuards(JwtCheck)
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    loadUsers(@Req() req) {
        const userId = req.user.sub;
        return this.usersService.findAllUsers(userId);
    };

    @Patch('e2ee-pubkey')
    setKey(@Req() req) {
        const userId = req.user.sub;
        const userPubKey = req.body.publicKey;

        return this.usersService.setUserPubKey(userId, userPubKey);
    }

    @Patch('contacts/:id')
    setUserContact(@Req() req, @Param('id') contactId: string) {
        const userContact: UserContact = {
            userId: req.user.sub,
            contactId: contactId,
        };

        return this.usersService.setUserContact(userContact);
    };

    @Delete('contacts/:id')
    deleteUserContact(@Req() req, @Param('id') contactId: string) {
        const userContact: UserContact = {
            userId: req.user.sub,
            contactId: contactId,
        };

        return this.usersService.deleteUserContact(userContact);
    }
} 