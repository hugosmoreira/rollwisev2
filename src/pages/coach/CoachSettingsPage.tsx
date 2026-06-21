import { useState } from 'react';
import { Tabs } from '@/components/common/Tabs';
import { Switch } from '@/components/common/Switch';
import { Button } from '@/components/common/Button';
import { Banner } from '@/components/common/Banner';
import { useTheme, type Theme } from '@/lib/theme';
import { ROUTES } from '@/lib/routes';
import shared from './Coach.module.css';
import styles from './CoachSettings.module.css';

const THEME_TABS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

const NOT_CONNECTED =
  'This setting will sync once the backend is connected in a later phase.';

export function CoachSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notif, setNotif] = useState({
    bookings: true,
    reminders: true,
    payouts: true,
    updates: false,
  });
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div>
      <p className={shared.intro}>
        Manage your appearance, notifications, and account preferences.
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
          <p className={styles.panelDesc}>Choose how RollWise looks to you.</p>
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

        {/* Notifications */}
        <section className={shared.panel}>
          <h2 className={styles.panelTitle}>Notifications</h2>
          <p className={styles.panelDesc}>Decide what RollWise can email you about.</p>
          <div className={styles.rows}>
            <div className={styles.row}>
              <div className={styles.rowText}>
                <div className={styles.rowTitle}>New bookings</div>
                <div className={styles.rowDesc}>
                  When a student books one of your sessions.
                </div>
              </div>
              <Switch
                checked={notif.bookings}
                onChange={(v) => setNotif((p) => ({ ...p, bookings: v }))}
                aria-label="New bookings"
              />
            </div>
            <div className={styles.row}>
              <div className={styles.rowText}>
                <div className={styles.rowTitle}>Session reminders</div>
                <div className={styles.rowDesc}>A reminder before each session.</div>
              </div>
              <Switch
                checked={notif.reminders}
                onChange={(v) => setNotif((p) => ({ ...p, reminders: v }))}
                aria-label="Session reminders"
              />
            </div>
            <div className={styles.row}>
              <div className={styles.rowText}>
                <div className={styles.rowTitle}>Payout alerts</div>
                <div className={styles.rowDesc}>When a payout is sent to you.</div>
              </div>
              <Switch
                checked={notif.payouts}
                onChange={(v) => setNotif((p) => ({ ...p, payouts: v }))}
                aria-label="Payout alerts"
              />
            </div>
            <div className={styles.row}>
              <div className={styles.rowText}>
                <div className={styles.rowTitle}>Product updates</div>
                <div className={styles.rowDesc}>
                  Occasional news about new RollWise features.
                </div>
              </div>
              <Switch
                checked={notif.updates}
                onChange={(v) => setNotif((p) => ({ ...p, updates: v }))}
                aria-label="Product updates"
              />
            </div>
          </div>
        </section>

        {/* Account */}
        <section className={shared.panel}>
          <h2 className={styles.panelTitle}>Account</h2>
          <p className={styles.panelDesc}>Manage how you sign in.</p>
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
