import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CaptionsService } from './captions.service';
import { Captions } from '@generated/api/models/captions';
import { AuthGuard } from 'src/guards/auth.guard';

@ApiTags('captions')
@Controller('captions')
export class CaptionsController {
  constructor(private readonly captionsService: CaptionsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all captions' })
  @ApiResponse({
    status: 200,
    description: 'Captions retrieved successfully',
    type: [Captions],
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter captions by user ID',
  })
  async getCaptions(@Query('userId') userId?: string): Promise<any> {
    if (userId) {
      const result = await this.captionsService.getCaptionsByUserId(userId);


      console.log('result:', result)
      return result.data;
    }
    const result = await this.captionsService.getAllCaptions();
    return result.data;
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get caption by ID' })
  @ApiResponse({
    status: 200,
    description: 'Caption retrieved successfully',
    type: Captions,
  })
  @ApiResponse({
    status: 404,
    description: 'Caption not found',
  })
  async getCaptionById(@Param('id') id: string): Promise<any> {
    const result = await this.captionsService.getCaptionById(id);
    return result.data;
  }
}
