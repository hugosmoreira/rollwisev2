import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ShieldCheck, UploadCloud } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Badge, type BadgeVariant } from '@/components/common/Badge';
import { Banner } from '@/components/common/Banner';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { coachService } from '@/services/coachService';
import { isFilled } from '@/lib/validation';
import type { BeltRank, VerificationStatus } from '@/types';
import shared from './Coach.module.css';
import styles from './Verification.module.css';

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
  { label: '5th degree', value: '5' },
];

const STATUS: Record<VerificationStatus, { label: string; variant: BadgeVariant }> = {
  unverified: { label: 'Unverified', variant: 'warning' },
  pending: { label: 'Pending review', variant: 'warning' },
  verified: { label: 'Verified', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

export function VerificationPage() {
  const { profile } = useAuth();
  const coachId = profile?.id;
  const { data: request, reload } = useAsync(
    () => (coachId ? coachService.getVerification(coachId) : Promise.resolve(null)),
    [coachId],
  );

  const [belt, setBelt] = useState<BeltRank>('black');
  const [degree, setDegree] = useState('0');
  const [academy, setAcademy] = useState('');
  const [lineage, setLineage] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [academyError, setAcademyError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [proofPath, setProofPath] = useState<string | null>(null);
  const [proofName, setProofName] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const status: VerificationStatus = request?.status ?? 'unverified';
  const statusMeta = STATUS[status];

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'Document must be 8MB or smaller.' });
      return;
    }
    setUploadingProof(true);
    setNotice(null);
    try {
      const path = await coachService.uploadVerificationProof(file);
      setProofPath(path);
      setProofName(file.name);
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not upload the document.',
      });
    } finally {
      setUploadingProof(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (!isFilled(academy)) {
      setAcademyError('Enter your academy.');
      return;
    }
    setAcademyError(undefined);
    const socialLinks: { label: string; url: string }[] = [];
    if (instagram.trim()) socialLinks.push({ label: 'Instagram', url: instagram.trim() });
    if (website.trim()) socialLinks.push({ label: 'Website', url: website.trim() });

    setPending(true);
    try {
      await coachService.submitVerification({
        belt,
        beltDegree: Number(degree) || undefined,
        academy: academy.trim(),
        lineage: lineage.trim() || undefined,
        socialLinks,
        proofUrl: proofPath ?? undefined,
      });
      setNotice({
        type: 'success',
        text: 'Verification submitted. We’ll review your credentials shortly.',
      });
      reload();
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not submit verification.',
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <p className={shared.intro}>
        Get verified to build trust with students and rank higher in search. We
        confirm your belt rank, academy, and lineage.
      </p>

      {notice && (
        <Banner variant={notice.type === 'success' ? 'success' : 'error'} className={shared.banner}>
          {notice.text}
        </Banner>
      )}

      <div className={shared.formSections}>
        <section className={shared.panel}>
          <div className={styles.statusHead}>
            <span className={styles.statusIcon}>
              <ShieldCheck size={24} strokeWidth={1.9} />
            </span>
            <div className={styles.statusBody}>
              <div className={styles.statusTitleRow}>
                <span className={styles.statusTitle}>Verification status</span>
                <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
              </div>
              <p className={styles.statusText}>
                {status === 'pending'
                  ? 'Your request is in review. Most reviews finish within a few days.'
                  : status === 'verified'
                    ? 'You’re verified — your profile shows the verified badge.'
                    : 'Submit your credentials below. Most reviews are completed within a few days.'}
              </p>
            </div>
          </div>
        </section>

        <section className={shared.panel}>
          <h2 className={shared.formSectionTitle}>Credentials</h2>
          <p className={shared.formSectionDesc}>Your rank and where you train.</p>
          <div className={shared.fields}>
            <div className={shared.formGrid}>
              <Select label="Belt rank" options={BELTS} value={belt} onChange={(e) => setBelt(e.target.value as BeltRank)} />
              <Select label="Degree" options={DEGREES} value={degree} onChange={(e) => setDegree(e.target.value)} />
            </div>
            <div className={shared.formGrid}>
              <Input
                label="Academy"
                placeholder="e.g. Atos Jiu-Jitsu"
                value={academy}
                onChange={(e) => {
                  setAcademy(e.target.value);
                  if (academyError) setAcademyError(undefined);
                }}
                error={academyError}
                required
              />
              <Input label="Lineage" placeholder="e.g. Ramon Lemos" value={lineage} onChange={(e) => setLineage(e.target.value)} />
            </div>
          </div>
        </section>

        <section className={shared.panel}>
          <h2 className={shared.formSectionTitle}>Proof & links</h2>
          <p className={shared.formSectionDesc}>Add your profiles and a document that proves your rank.</p>
          <div className={shared.fields}>
            <div className={shared.formGrid}>
              <Input label="Instagram" placeholder="@yourhandle" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
              <Input label="Website" type="url" placeholder="https://" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div>
              <span className={shared.fieldLabel}>Upload proof</span>
              <label className={styles.dropzone}>
                <span className={styles.dropIcon}>
                  <UploadCloud size={22} strokeWidth={1.8} />
                </span>
                <span className={styles.dropText}>
                  {uploadingProof
                    ? 'Uploading…'
                    : proofName
                      ? `Attached: ${proofName}`
                      : 'Click to upload a document'}
                </span>
                <span className={styles.dropHint}>
                  Belt certificate or federation record · PDF, JPG, PNG up to 8MB
                </span>
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={onFile}
                />
              </label>
            </div>
          </div>
        </section>
      </div>

      <div className={shared.formActions}>
        <Button type="submit" loading={pending} disabled={status === 'verified'}>
          {status === 'unverified' ? 'Submit for verification' : 'Resubmit'}
        </Button>
      </div>
    </form>
  );
}
