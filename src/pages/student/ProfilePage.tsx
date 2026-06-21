import { useEffect, useState } from 'react';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { Banner } from '@/components/common/Banner';
import { AvatarUpload } from '@/components/common/AvatarUpload';
import { useAuth } from '@/lib/auth';
import { profileService } from '@/services/profileService';
import shared from './Student.module.css';
import styles from './Profile.module.css';

type Notice = { type: 'success' | 'error'; text: string };

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Populate the form once the profile loads (keyed on id so we don't
  // clobber edits when the profile is refreshed after a save).
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setCity(profile.city ?? '');
      setBio(profile.bio ?? '');
    }
  }, [profile?.id]);

  const onSave = async () => {
    if (!profile) return;
    setNotice(null);
    setPending(true);
    try {
      await profileService.updateProfile(profile.id, { fullName, city, bio });
      await refreshProfile();
      setNotice({ type: 'success', text: 'Profile saved.' });
    } catch (e) {
      setNotice({
        type: 'error',
        text: e instanceof Error ? e.message : 'Could not save your profile.',
      });
    } finally {
      setPending(false);
    }
  };

  const onReset = () => {
    if (!profile) return;
    setFullName(profile.fullName);
    setCity(profile.city ?? '');
    setBio(profile.bio ?? '');
    setNotice(null);
  };

  return (
    <div>
      <p className={shared.intro}>
        Your public profile and training details. This is how coaches see you when
        you book.
      </p>

      {notice && (
        <Banner
          variant={notice.type === 'success' ? 'success' : 'error'}
          className={styles.banner}
        >
          {notice.text}
        </Banner>
      )}

      <div className={shared.panel}>
        <AvatarUpload
          name={fullName || profile?.fullName}
          rowClassName={styles.avatarRow}
          metaClassName={styles.avatarMeta}
          hintClassName={styles.avatarHint}
          onNotice={setNotice}
        />

        <div className={styles.grid}>
          <Input
            label="Full name"
            placeholder="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={profile?.email ?? ''}
            disabled
            hint="Email is managed in account settings."
          />
          <Input
            label="City"
            placeholder="City, Country"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Textarea
            label="Bio"
            containerClassName={styles.full}
            placeholder="Tell coaches about your training goals and experience…"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onReset} disabled={pending}>
            Reset
          </Button>
          <Button type="button" onClick={onSave} loading={pending}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
