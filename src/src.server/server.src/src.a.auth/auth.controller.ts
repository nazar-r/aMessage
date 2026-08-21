import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtCheck } from '../src.b.jwt/jwt.extractor';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthUser } from '../src.extensions/extensions.types/auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleOauth() { }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubOauth() { }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))

  async googleRedirect(@Req() req: Request, @Res() res: Response) {
    const { access_token } = await this.authService.signUser(req.user as AuthUser);
    this.authService.signCookies(res, access_token);

    return res.redirect(process.env.FRONTEND_REDIRECT_URL);
  }

  @Get('github/redirect')
  @UseGuards(AuthGuard('github'))

  async githubRedirect(@Req() req: Request, @Res() res: Response) {
    const { access_token } = await this.authService.signUser(req.user as AuthUser);
    this.authService.signCookies(res, access_token);

    return res.redirect(process.env.FRONTEND_REDIRECT_URL);
  }

  @Get('check')
  @UseGuards(JwtCheck)
  checkLogin(@Req() req) {
    return { isLoggedIn: true, user: req.user };
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}