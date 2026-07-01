import { Controller, Get, Req, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessageDTO } from './messages.image/messages.create.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('messages')
@UseGuards(AuthGuard('jwt'))
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }
  @Get()
  findMessagesByRoom(@Req() req) {
    const cookiesUserId = req.user.userId;
    return this.messagesService.findMessagesByRoom(cookiesUserId);
  }
}