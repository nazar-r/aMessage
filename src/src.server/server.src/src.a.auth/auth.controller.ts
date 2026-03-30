import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { checkJwtCookies } from '../src.b.jwt/jwt.check.cookies';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleOauth() { }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: FastifyRequest & { user?: any },
    @Res() reply: FastifyReply,
  ) {
    const { access_token } = await this.authService.googleLogin(req.user);

    reply.setCookie('access_token', access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 6,
    });

    return reply.code(302).redirect('http://localhost:5173/lobby-prev');
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubOauth() { }

  @Get('github/redirect')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(
    @Req() req: FastifyRequest & { user?: any },
    @Res() reply: FastifyReply,
  ) {
    const { access_token } = await this.authService.githubLogin(req.user);

    reply.setCookie('access_token', access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 6,
    });

    return reply.code(302).redirect('http://localhost:5173/lobby-prev');
  }

  @Get('check')
  @UseGuards(checkJwtCookies)
  checkLogin(@Req() req: FastifyRequest & { user?: any }) {
    return { isLoggedIn: true, user: req.user };
  }
}