import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { AuthModule } from '../src.a.auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}