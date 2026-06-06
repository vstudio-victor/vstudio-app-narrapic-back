import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { GenerationsService } from 'src/supabase/generations.service';

@Module({
  imports: [SupabaseModule],
  providers: [GenerateService, GenerationsService],
  controllers: [GenerateController],
})
export class GenerateModule {}
