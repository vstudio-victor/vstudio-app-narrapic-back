import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Credentials } from '../../generated/api/models/credentials';
@ApiTags('users')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('user')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getCurrentUser(@CurrentUser() user: any) {
    return this.usersService.getUserById(user.id);
  }

  @Patch('user')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'User updated',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateUser(
    @CurrentUser() user: any,
    @Body() updateData: { name?: string; email?: string },
  ) {
    return this.usersService.updateUser(user.id, updateData);
  }

  @Post('signUp')
  @ApiOperation({ summary: 'Sign up' })
  @ApiResponse({
    status: 200,
    description: 'Account created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  async signUp(@Body() body: Credentials): Promise<any> {
    return this.usersService.signUp(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login to account' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() body: { email: string; password: string }): Promise<any> {
    return this.usersService.login(body.email, body.password);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout from account' })
  @ApiResponse({
    status: 204,
    description: 'Logout successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logout(): Promise<void> {
    await this.usersService.logout();
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(@Body() body: { refresh_token: string }): Promise<any> {
    return this.usersService.refreshToken(body.refresh_token);
  }
}
