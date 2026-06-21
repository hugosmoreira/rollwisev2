import { useEffect, useState } from 'react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Tabs } from '@/components/common/Tabs';
import { TagInput } from '@/components/common/TagInput';
import { Button } from '@/components/common/Button';
import { Banner } from '@/components/common/Banner';
import { AvatarUpload } from '@/components/common/AvatarUpload';
import { LoadingState } from '@/components/common/LoadingState';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { coachService } from '@/services/coachService';
import type { BeltRank, Ruleset } from '@/types';
import shared from './Coach.module.css';

const BELTS = [
  { label: 'White', value: 'white' },
  { label: 'Blue', value: 'blue' },
  { label: 'Purple', value: 'purple' },
  { label: 'Brown', value: 'brown' },
  { label: 'Black', value: 'black' },
];
const DEGREES = [
  { label: 'No degree', value: '0' },
  { label: '1st degree', value: '1' },
  { label: '2nd degree', value: '2' },
  { label: '3rd degree', value: '3' },
  { label: '4th degree', value: '4' },
];
const RULESET_TABS = [
  { value: 'gi', label: 'Gi' },
  { value: 'no-gi', label: 'No-Gi' },
  { value: 'both', label: 'Gi & No-Gi' },
];

type Notice = { type: 'success' | 'error'; text: string };

export function CoachProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { data: coach, loading } = useAsync(
    () => coachService.getCurrentCoach(),
    [profile?.id],
  );

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [belt, setBelt] = useState<BeltRank>('black');
  const [degree, setDegree] = useState('0');
  const [academy, setAcademy] = useState('');
  const [rate, setRate] = useState('');
  const [ruleset, setRuleset] = useState<Ruleset>('both');
  const [focus, setFocus] = useState<string[]>([]);
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!coach) return;
    setName(coach.fullName);
    setCity(coach.city ?? '');
    setBelt(coach.belt);
    setDegree(String(coach.beltDegree ?? 0));
    setAcademy(coach.academy ?? '');
    setRate(coach.hourlyRate ? String(coach.hourlyRate) : '');
    setRuleset(coach.rulesets[0] ?? 'both');
    setFocus(coach.focusTags);
    const links = coach.socialLinks ?? [];
    setInstagram(links.find((l) => l.label.toLowerCase() === 'instagram')?.url ?? '');
    setWebsite(links.find((l) => l.label.toLowerCase() === 'website')?.url ?? '');
  }, [coach?.id]);

  useEffect(() => {
    if (profile) setBio(profile.bio ?? '');
  }, [profile?.id]);

  const onSave = async () => {
    if (!profile) return;
    setNotice(null);
    setPending(true);
    const socialLinks: { label: string; url: string }[] = [];
    if (instagram.trim()) socialLinks.push({ label: 'Instagram', url: instagram.trim() });
    if (website.trim()) socialLinks.push({ label: 'Website', url: website.trim() });
    try {
      await coachService.updateCoachProfile(profile.id, {
        fullName: name,
        city,
        bio,
        belt,
        beltDegree: Number(degree),
        academy: academy || null,
        hourlyRate: rate === '' ? null : Number(rate),
        rulesets: [ruleset],
        focusTags: focus,
        socialLinks,
      });
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

  if (loading) {
    return (
      <div>
        <p className={shared.intro}>Your public coach profile.</p>
        <LoadingState label="Loading profile…" />
      </div>
    );
  }

  return (
    <div>
      <p className={shared.intro}>
        Your public coach profile. This is what students see when they discover and
        book you.
      </p>

      {notice && (
        <Banner
          variant={notice.type === 'success' ? 'success' : 'error'}
          className={shared.banner}
        >
          {notice.text}
        </Banner>
      )}

      <div className={shared.formSections}>
        <section className={shared.panel}>
          <h2 className={shared.formSectionTitle}>Public profile</h2>
          <p className={shared.formSectionDesc}>How students see you at a glance.</p>

          <AvatarUpload
            name={name}
            rowClassName={shared.avatarRow}
            metaClassName={shared.avatarMeta}
            hintClassName={shared.avatarHint}
            onNotice={setNotice}
          />

          <div className={shared.fields}>
            <div className={shared.formGrid}>
              <Input label="Display name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="City" placeholder="City, Country" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <Textarea
              label="Bio"
              placeholder="Your background, teaching style, and what students can expect…"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
        </section>

        <section className={shared.panel}>
          <h2 className={shared.formSectionTitle}>Coaching details</h2>
          <p className={shared.formSectionDesc}>Your rank, rate, and what you specialize in.</p>
          <div className={shared.fields}>
            <div className={shared.formGrid3}>
              <Select label="Belt rank" options={BELTS} value={belt} onChange={(e) => setBelt(e.target.value as BeltRank)} />
              <Select label="Degree" options={DEGREES} value={degree} onChange={(e) => setDegree(e.target.value)} />
              <Input label="Hourly rate (USD)" type="number" min={0} placeholder="90" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <Input label="Academy" placeholder="e.g. Atos Jiu-Jitsu" value={academy} onChange={(e) => setAcademy(e.target.value)} />
            <div>
              <span className={shared.fieldLabel}>Ruleset</span>
              <Tabs tabs={RULESET_TABS} value={ruleset} onChange={(v) => setRuleset(v as Ruleset)} aria-label="Ruleset" />
            </div>
            <TagInput
              label="Focus areas"
              value={focus}
              onChange={setFocus}
              placeholder="Add a specialty (e.g. Leg Locks) and press Enter"
            />
          </div>
        </section>

        <section className={shared.panel}>
          <h2 className={shared.formSectionTitle}>Links</h2>
          <p className={shared.formSectionDesc}>Where students can find you online.</p>
          <div className={shared.formGrid}>
            <Input label="Instagram" placeholder="@yourhandle" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            <Input label="Website" type="url" placeholder="https://" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
        </section>
      </div>

      <div className={shared.formActions}>
        <Button type="button" onClick={onSave} loading={pending}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
