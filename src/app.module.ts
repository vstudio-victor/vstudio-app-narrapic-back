import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { UsersModule } from './users/users.module';
import { GenerateModule } from './generate/generate.module';
import { CaptionsModule } from './captions/captions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    GenerateModule,
    UsersModule,
    CaptionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
