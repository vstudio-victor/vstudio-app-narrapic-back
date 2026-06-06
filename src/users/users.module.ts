import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { AuthGuard } from '../guards/auth.guard';

@Module({
  imports: [SupabaseModule],
  providers: [UsersService, AuthGuard],
  controllers: [UsersController],
  exports: [AuthGuard],
})
export class UsersModule {}
