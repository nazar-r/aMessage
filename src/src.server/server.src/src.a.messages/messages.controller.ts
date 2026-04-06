import { Controller, Get, Req, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessageDTO } from './messages.image/messages.create.dto';
import { JwtCheckCookies } from '../src.b.jwt/jwt.check.cookies';

@Controller('messages')
@UseGuards(JwtCheckCookies)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }
  @Get()
  findMessagesByRoom(@Req() req) {
    const cookiesUserId = req.user.userId;
    return this.messagesService.findMessagesByRoom(cookiesUserId);
  }
}