import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { SupabaseModule } from 'supabase/supabase.module';
import { GenerationsService } from 'supabase/generations.service';

@Module({
  imports: [SupabaseModule],
  providers: [GenerateService, GenerationsService],
  controllers: [GenerateController],
})
export class GenerateModule {}
