import { Controller, Get, Req, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './notes.image/notes.creating.dto';
import { UpdateNoteDto } from './notes.image/notes.updating.dto';
import { JwtCheckCookies } from '../src.b.jwt/jwt.check.cookies';

@Controller('notes')
@UseGuards(JwtCheckCookies)
export class NotesController {
  constructor(private readonly notesService: NotesService) { }

  @Post()
  create(@Body() createNoteDto: CreateNoteDto, @Req() req) {
    const cookiesUserId = req.user.userId;
    return this.notesService.create(createNoteDto, cookiesUserId);
  }

  @Get()
  findNotes(@Req() req) {
    const cookiesUserId = req.user.userId;
    return this.notesService.findNotes(cookiesUserId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNoteDto: CreateNoteDto, @Req() req: any) {
    const cookiesUserId = req.user.userId;
    return this.notesService.update(id, cookiesUserId, updateNoteDto.content);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    return this.notesService.remove(id, userId);
  }
}