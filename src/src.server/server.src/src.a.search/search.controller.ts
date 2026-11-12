import { JwtCheck } from '../src.b.jwt/jwt.extractor';
import { SearchService } from './search.service';
import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import type { TBody, TReq }  from '../src.c.extensions/extensions.types/types.auth';

@Controller('search')
@UseGuards(JwtCheck)
export class SearchController {
  constructor(private readonly searchService: SearchService) { }

  @Get()
  async getAiChatHistory(@Req() req: TReq) {
    const userId = req.user.sub;
    return this.searchService.getChatHistory(userId);
  }

  @Post()
  async handleSearch( @Req() req: TReq, @Body() body: TBody) {
    const userId = req.user.sub;
    const prompt = body.content;

    return this.searchService.useGemini(prompt, userId);
  }
}