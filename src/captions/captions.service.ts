import { Injectable } from '@nestjs/common';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { SupabaseService } from 'supabase/supabase.service';
import { Captions } from '@generated/api/models/captions';

@Injectable()
export class CaptionsService {
  constructor(private db: SupabaseService) {}

  async getAllCaptions(): Promise<PostgrestSingleResponse<Captions[]>> {
    const response = await this.db
      .getClient()
      .from('ContentGenerated')
      .select(
        `*,
        Generations (
          image_url,
          platform,
          style
        )`,
      )
      .order('created_at', { ascending: false });

    if (response.data) {
      response.data = response.data.map((item) => {
        const { Generations, ...rest } = item;
        return {
          ...rest,
          ...(Generations || {}), // Spread Generations fields into parent
        };
      });
    }
    return response;
  }

  async getCaptionById(id: string): Promise<PostgrestSingleResponse<Captions>> {
    return await this.db
      .getClient()
      .from('ContentGenerated')
      .select(
        `*,
        Generations (
          image_url,
          platform,
          style
        )`,
      )
      .eq('id', id)
      .single();
  }

  async getCaptionsByUserId(
    userId: string,
  ): Promise<PostgrestSingleResponse<Captions[]>> {
    const response = await this.db
      .getClient()
      .from('ContentGenerated')
      .select(
        `*,
        Generations (
          image_url,
          platform,
          style
        )`,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (response.data) {
      response.data = response.data.map((item) => {
        const { Generations, ...rest } = item;
        return {
          ...rest,
          ...(Generations || {}), // Spread Generations fields into parent
        };
      });
    }

    return response;
  }
}
