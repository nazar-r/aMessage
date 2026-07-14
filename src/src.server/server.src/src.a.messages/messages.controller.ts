// import { Controller, Get, Req, Param, UseGuards } from '@nestjs/common';
// import { MessagesService } from './messages.service';
// import { JwtCheck } from '../src.b.jwt/jwt.extractor';
// import type { ChatUser } from "../src.extensions/extensions.types/types"

// @UseGuards(JwtCheck)
// @Controller('chats')
// export class MessagesController {
//   constructor(private messagesService: MessagesService) { }
//   @Get()
//   getChats(
//     @Req() req,
//   ) {
//     const userId = req.user.userId;
//     return this.messagesService.findMessagesByRoom(userId);
//   };

//   @Get(':id')
//   getChatMessages(
//     @Req() req,
//     @Param('id') chatRoomId: string,
//   ) {
//     const chatUser: ChatUser = {
//       userId: req.user.sub,
//       chatRoomId: chatRoomId,
//     };

//     return this.messagesService.findMessagesByRoom(chatUser);
//   };
// }

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