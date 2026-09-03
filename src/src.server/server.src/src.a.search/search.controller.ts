import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtCheck } from '../src.b.jwt/jwt.extractor';

@Controller('search')
@UseGuards(JwtCheck)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  async handleSearch(@Body() body, @Req() req) {
    const userId = req.user.sub;
    const prompt = body.prompt;

    return this.searchService.processSearch(prompt, userId);
  }
}