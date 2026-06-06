import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { GenerationsService } from './generations.service';

@Module({
  providers: [SupabaseService, GenerationsService],
  exports: [SupabaseService],
})
export class SupabaseModule {}