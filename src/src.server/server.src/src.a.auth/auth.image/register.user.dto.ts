import { IsEmail} from 'class-validator';

export class AuthDto {
  @IsEmail()
  email: string;
}