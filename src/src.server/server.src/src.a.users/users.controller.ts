import { Controller, Body, Get, Post, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import type { UserImage, SetUserContactDTO } from "../src.extensions/extensions.types/types"

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    findMessages(@Req() req) {
        const cookiesUserId = req.user.userId;
        return this.usersService.findAllUsers(cookiesUserId);
    }

    @Post('setcontacts')
    setUserContact(
        @Req() req,
        @Body() newContact: SetUserContactDTO,
    ) {
        const userId = req.user.userId;
        const contactId = newContact.contactId;

        const usersContact: UserImage = {
            userId: userId,
            contactId: contactId,
        };

        return this.usersService.setUserContact(usersContact);
    }
} 