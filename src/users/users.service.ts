import { Credentials } from '../../generated/api/models/credentials';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';

export interface IUser {
  id: string;
  login: string;
  last_name: string;
  first_name: string;
  email: string;
  name: string;
  created_at: string;
}

export interface ICredentials {
  phone: string;
  email: string;
  password: string;
  channel: Channel;
}

export type Channel = 'sms' | 'whatsapp' | undefined;

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  async getUserById(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('Users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updateUser(
    userId: string,
    updateData: { name?: string; email?: string },
  ) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('Users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async signUp(credentials: Credentials) {
    const supabase = this.supabaseService.getClient();

    if (credentials.email) {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password ?? '',
      });

      if (error) {
        throw new InternalServerErrorException({
          message: 'Failed to create user account',
          details: error.message,
          code: error.code,
        });
      }

      if (!data.user || !data.session) {
        throw new InternalServerErrorException(
          'Signup succeeded but no user/session returned',
        );
      }

      console.log('data', data.user);
      return data.user;
    }
  }

  async login(email: string, password: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_in: data.session?.expires_in,
      token_type: 'bearer',
      user: data.user,
    };
  }

  async logout() {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    console.log('toto');

    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshToken: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_in: data.session?.expires_in,
      token_type: 'bearer',
      user: data.user,
    };
  }

  async getCurrentUser(accessToken: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error) {
      throw new Error(error.message);
    }

    return data.user;
  }
}
