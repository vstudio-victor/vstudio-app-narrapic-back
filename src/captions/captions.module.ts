import { Module } from '@nestjs/common';
import { CaptionsController } from './captions.controller';
import { CaptionsService } from './captions.service';
import { SupabaseModule } from 'supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [CaptionsController],
  providers: [CaptionsService],
})
export class CaptionsModule {}
