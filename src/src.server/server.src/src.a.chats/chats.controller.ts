import { JwtCheck } from '../src.b.jwt/jwt.extractor';
import { ChatsService } from './chats.service';
import { Controller, Get, Req, Delete, UseGuards } from '@nestjs/common';
import type { TReq } from '../src.c.extensions/extensions.types/types.auth';

@Controller('chats')
@UseGuards(JwtCheck)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) { }

  @Get()
  findUserChats(@Req() req: TReq) {
    const userId = req.user.sub;
    return this.chatsService.getUserChats(userId);
  }

  @Delete(':chatId')
  deleteUserChat(@Req() req: TReq) {
    const userId = req.user.sub;
    return this.chatsService.removeUserChat(userId);
  }
}