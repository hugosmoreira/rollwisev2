import { useRef, useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/lib/auth';
import { profileService } from '@/services/profileService';

const MAX_BYTES = 4 * 1024 * 1024; // 4MB
const ACCEPTED = ['image/jpeg', 'image/png'];

export type AvatarNotice = { type: 'success' | 'error'; text: string };

interface AvatarUploadProps {
  /** Falls back to the signed-in profile's name for initials. */
  name?: string;
  /** Class hooks so each page can keep its own layout/styling. */
  rowClassName?: string;
  metaClassName?: string;
  hintClassName?: string;
  /** Bubble a success/error message up to the page's banner. */
  onNotice?: (notice: AvatarNotice) => void;
}

/**
 * Avatar + "Change photo" control. Uploads to Supabase Storage, saves the
 * resulting URL to the user's profile, and refreshes auth state so the new
 * image shows everywhere (sidebar, topbar). Shared by student & coach pages.
 */
export function AvatarUpload({
  name,
  rowClassName,
  metaClassName,
  hintClassName,
  onNotice,
}: AvatarUploadProps) {
  const { profile, refreshProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the user re-pick the same file later
    if (!file || !profile) return;

    if (!ACCEPTED.includes(file.type)) {
      onNotice?.({ type: 'error', text: 'Please choose a JPG or PNG image.' });
      return;
    }
    if (file.size > MAX_BYTES) {
      onNotice?.({ type: 'error', text: 'Image must be 4MB or smaller.' });
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    try {
      const url = await profileService.uploadAvatar(file);
      await profileService.updateProfile(profile.id, { avatarUrl: url });
      await refreshProfile();
      onNotice?.({ type: 'success', text: 'Photo updated.' });
    } catch (err) {
      onNotice?.({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not upload your photo.',
      });
    } finally {
      setPreview(null);
      URL.revokeObjectURL(localUrl);
      setUploading(false);
    }
  };

  return (
    <div className={rowClassName}>
      <Avatar name={name || profile?.fullName} src={preview ?? profile?.avatarUrl} size="xl" />
      <div className={metaClassName}>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          hidden
          onChange={onFile}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
          leftIcon={<Upload size={16} strokeWidth={1.9} />}
        >
          Change photo
        </Button>
        <span className={hintClassName}>JPG or PNG, up to 4MB.</span>
      </div>
    </div>
  );
}
