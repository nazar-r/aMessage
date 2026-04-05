import { Controller, Get, Req, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessageDTO } from './messages.image/messages.create.dto';
import { JwtCheckCookies } from '../src.b.jwt/jwt.check.cookies';

@Controller('messages')
@UseGuards(JwtCheckCookies)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  // @Post()
  // create(@Body() createMessageDto: CreateMessageDto, @Req() req) {
  //   const cookiesUserId = req.user.userId;
  //   return this.messagesService.create(createMessageDto, cookiesUserId);
  // }

  @Get()
  findMessagesByRoom(@Req() req) {
    const cookiesUserId = req.user.userId;
    return this.messagesService.findMessagesByRoom(cookiesUserId);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateMessageDto: CreateMessageDto, @Req() req: any) {
  //   const cookiesUserId = req.user.userId;
  //   return this.messagesService.update(id, cookiesUserId, updateMessageDto.content);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string, @Req() req: any) {
  //   const userId = req.user.sub;
  //   return this.messagesService.remove(id, userId);
  // }
}