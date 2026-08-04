import { Controller, Get, Req, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtCheck } from '../src.b.jwt/jwt.extractor';

@Controller('chats')
@UseGuards(JwtCheck)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }
  @Get()
  findUserChats(@Req() req) {
    const userId = req.user.sub;
    // console.log(userId)
    return this.messagesService.findUserChats(userId);
  }

  @Delete(':chatId')
  deleteUserChat(@Req() req) {
    const userId = req.user.sub;
    const roomId = req.params.chatId;

    return this.messagesService.deleteUserChat(userId, roomId);
  }
}