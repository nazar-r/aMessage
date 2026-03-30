import { PartialType } from '@nestjs/mapped-types';
import { CreateNoteDto } from './notes.creating.dto';

export class UpdateNoteDto extends PartialType(CreateNoteDto) {}
