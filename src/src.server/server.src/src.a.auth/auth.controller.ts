import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtCheckCookies } from '../src.b.jwt/jwt.check.cookies';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleOauth() { }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const { access_token } = await this.authService.googleLogin(req.user);
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
      path: '/',
    });
    return res.redirect('https://amessage.site/chat-prev');
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubOauth() { }

  @Get('github/redirect')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req, @Res() res: Response) {
    const { access_token } = await this.authService.googleLogin(req.user);
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
      path: '/',
    });
    return res.redirect('https://amessage.site/chat-prev');
  }

  @Get('check')
  @UseGuards(JwtCheckCookies)
  checkLogin(@Req() req: Request) {
    return { isLoggedIn: true, user: req.user };
  }
}
