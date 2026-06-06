import { Injectable } from '@nestjs/common';
import {
  createClient,
  PostgrestSingleResponse,
  SupabaseClient,
} from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Generate } from '@generated/api/models/generate';
import { Database } from 'src/types/database.types';
import { ContentResponse } from '@generated/api/models/content-response';

type Generation = Database['public']['Tables']['Generations']['Row'];
type ContentGenerated = Database['public']['Tables']['ContentGenerated']['Row'];

@Injectable()
export class GenerationsService {
  constructor(private db: SupabaseService) {}

  async saveUserRequest(
    body: Generate,
    user_id: string,
  ): Promise<PostgrestSingleResponse<Generation>> {
    return await this.db
      .getClient()
      .from('Generations')
      .insert({
        ...body,
        user_id,
      })
      .select()
      .single();
  }

  async saveUserGeneration(
    body: ContentResponse,
    generations_id: string,
    user_id: string,
  ): Promise<PostgrestSingleResponse<ContentGenerated>> {

    return await this.db
      .getClient()
      .from('ContentGenerated')
      .insert({
        ...body,
        user_id,
        generations_id,
      })
      .select()
      .single();
  }

  async getAllContentByUserId(): Promise<PostgrestSingleResponse<any>> {
    return await this.db.getClient().from('ContentGenerated').select(`,
    Generation (
      image_url
    )`);
  }
}
