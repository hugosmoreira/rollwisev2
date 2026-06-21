/* =================================================================
   RollWise — Profile service  (Supabase table: `profiles`)
   ================================================================= */

import type { Profile } from '@/types';
import type { Database } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';
import { rowToProfile } from './mappers';

type ProfilesUpdate = Database['public']['Tables']['profiles']['Update'];

/** Fields a user can edit on their own profile. */
export type ProfileUpdate = Partial<
  Pick<Profile, 'fullName' | 'avatarUrl' | 'city' | 'bio'>
>;

/** Map a camelCase patch to the snake_case columns, omitting untouched fields. */
function toRow(patch: ProfileUpdate): ProfilesUpdate {
  const row: ProfilesUpdate = {};
  if (patch.fullName !== undefined) row.full_name = patch.fullName;
  if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.bio !== undefined) row.bio = patch.bio;
  return row;
}

export const profileService = {
  /** The signed-in user's profile, or null if not authenticated. */
  async getCurrentProfile(): Promise<Profile | null> {
    const sb = getSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return null;
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToProfile(data) : null;
  },

  /** A profile by id. */
  async getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToProfile(data) : null;
  },

  /** Update the signed-in user's profile. */
  async updateProfile(id: string, patch: ProfileUpdate): Promise<Profile> {
    const { data, error } = await getSupabase()
      .from('profiles')
      .update(toRow(patch))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return rowToProfile(data);
  },

  /** Upload an avatar image to the `avatars` bucket; returns its public URL. */
  async uploadAvatar(file: File): Promise<string> {
    const sb = getSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) throw new Error('You must be signed in to upload a photo.');

    // Path must start with the user's id (enforced by storage RLS). A unique
    // filename per upload avoids stale CDN caching of a reused path.
    const ext =
      (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') ||
      'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await sb.storage.from('avatars').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });
    if (error) {
      if (/bucket not found/i.test(error.message)) {
        throw new Error(
          'Avatar storage is not set up yet. Run supabase/avatars.sql in the Supabase SQL editor.',
        );
      }
      throw error;
    }

    const { data } = sb.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  },
};
