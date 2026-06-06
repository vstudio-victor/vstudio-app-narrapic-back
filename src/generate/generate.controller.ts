import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GenerateService } from './generate.service';
import { Generate } from '@generated/api/models/generate';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';

@Controller()
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post('generate')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async generate(@Body() request: Generate, @CurrentUser() user: any) {
    return await this.generateService.sendMessage(request, user.id);
  }
}
