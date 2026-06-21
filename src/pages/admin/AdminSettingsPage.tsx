import { useState } from 'react';
import { Tabs } from '@/components/common/Tabs';
import { Switch } from '@/components/common/Switch';
import { Button } from '@/components/common/Button';
import { Banner } from '@/components/common/Banner';
import { useTheme, type Theme } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import shared from './Admin.module.css';
import styles from './AdminSettings.module.css';

const THEME_TABS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

const NOT_CONNECTED =
  'This setting will sync once the backend is connected in a later phase.';

export function AdminSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [platform, setPlatform] = useState({
    applications: true,
    requireVerification: true,
    maintenance: false,
  });
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div>
      <p className={shared.intro}>
        Platform-wide preferences and controls.
      </p>

      {notice && (
        <Banner variant="info" className={shared.banner}>
          {notice}
        </Banner>
      )}

      <div className={styles.stack}>
        {/* Appearance */}
        <section className={shared.panel}>
          <h2 className={styles.panelTitle}>Appearance</h2>
          <p className={styles.panelDesc}>Choose how the admin console looks.</p>
          <div className={styles.rows}>
            <div className={styles.row}>
              <div className={styles.rowText}>
                <div className={styles.rowTitle}>Theme</div>
                <div className={styles.rowDesc}>Switch between dark and light.</div>
              </div>
              <Tabs
                tabs={THEME_TABS}
                value={theme}
                onChange={(v) => setTheme(v as Theme)}
                aria-label="Theme"
              />
            </div>
          </div>
        </section>

        {/* Platform controls */}
        <section className={shared.panel}>
          <h2 className={styles.panelTitle}>Platform</h2>
          <p className={styles.panelDesc}>Control how RollWise operates.</p>
          <div className={styles.rows}>
            <div className={styles.row}>
              <div className={styles.rowText}>
                <div className={styles.rowTitle}>Accept new coach applications</div>
                <div className={styles.rowDesc}>
                  Allow new coaches to apply and submit verification.
                </div>
              </div>
              <Switch
                checked={platform.applications}
                onChange={(v) => setPlatform((p) => ({ ...p, applications: v }))}
                aria-label="Accept new coach applications"
              />
            </div>
            <div className={styles.row}>
              <div className={styles.rowText}>
                <div className={styles.rowTitle}>Require verification to publish</div>
                <div className={styles.rowDesc}>
                  Coaches must be verified before publishing sessions.
                </div>
              </div>
              <Switch
                checked={platform.requireVerification}
                onChange={(v) =>
                  setPlatform((p) => ({ ...p, requireVerification: v }))
                }
                aria-label="Require verification to publish"
              />
            </div>
            <div className={styles.row}>
              <div className={styles.rowText}>
                <div className={styles.rowTitle}>Maintenance mode</div>
                <div className={styles.rowDesc}>
                  Temporarily take the platform offline for users.
                </div>
              </div>
              <Switch
                checked={platform.maintenance}
                onChange={(v) => setPlatform((p) => ({ ...p, maintenance: v }))}
                aria-label="Maintenance mode"
              />
            </div>
          </div>
        </section>

        {/* Account */}
        <section className={shared.panel}>
          <h2 className={styles.panelTitle}>Account</h2>
          <p className={styles.panelDesc}>Manage your admin sign-in.</p>
          <div className={styles.rows}>
            <div className={styles.row}>
              <div className={styles.rowText}>
                <div className={styles.rowTitle}>Password</div>
                <div className={styles.rowDesc}>
                  Send a reset link to change your password.
                </div>
              </div>
              <Button to={ROUTES.forgotPassword} variant="secondary" size="sm">
                Change password
              </Button>
            </div>
            <div className={styles.row}>
              <div className={styles.rowText}>
                <div className={styles.rowTitle}>Email address</div>
                <div className={styles.rowDesc}>Update the email on your account.</div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setNotice(NOT_CONNECTED)}
              >
                Update
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
