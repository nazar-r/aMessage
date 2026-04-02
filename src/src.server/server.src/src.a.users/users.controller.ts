import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    findMessages(@Req() req) {
        const cookiesUserId = req.user.userId;
        return this.usersService.findAllUsers(cookiesUserId);
    }

}