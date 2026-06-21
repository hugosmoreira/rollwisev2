import { LegalPage, type LegalSection } from './LegalPage';

const SECTIONS: LegalSection[] = [
  {
    heading: 'Overview',
    body: [
      'This Privacy Policy explains what information RollWise collects, how we use it, and the choices you have. It applies to the RollWise marketplace for private Jiu-Jitsu coaching.',
    ],
  },
  {
    heading: 'Information we collect',
    body: [
      'Account information: your name, email address, role (student or coach), and password (stored securely by our authentication provider).',
      'Profile information: optional details you add, such as a photo, city, bio, belt rank, academy, and — for coaches — verification documents.',
      'Booking and payment information: the sessions you book or run, and payment records. Card details are entered directly with our payment processor (Stripe) and are not stored by RollWise.',
    ],
  },
  {
    heading: 'How we use your information',
    body: [
      'To operate the platform — create your account, show coaches and sessions, process bookings and payouts, send booking confirmation emails, and provide support.',
      'To keep the platform safe — to review coach verification, prevent fraud and abuse, and enforce our Terms.',
    ],
  },
  {
    heading: 'Service providers',
    body: [
      'We share information with trusted providers only as needed to run the service: Supabase (hosting, database, authentication, and file storage), Stripe (payments and payouts), and Resend (transactional email). These providers process data on our behalf under their own terms and privacy policies.',
    ],
  },
  {
    heading: 'Data retention',
    body: [
      'We keep your information for as long as your account is active or as needed to provide the service and meet legal, accounting, or reporting obligations.',
    ],
  },
  {
    heading: 'Your rights',
    body: [
      'Depending on where you live, you may have the right to access, correct, or delete your personal information, or to object to certain processing. You can edit much of your profile in the app, and you can contact us to request access or deletion.',
    ],
  },
  {
    heading: 'Cookies and local storage',
    body: [
      'RollWise uses your browser’s local storage to remember preferences such as your light/dark theme and to keep you signed in. We do not use advertising trackers.',
    ],
  },
  {
    heading: 'Security',
    body: [
      'We use industry-standard measures, including Row-Level Security on our database and server-side handling of payment secrets, to protect your information. No method of transmission or storage is completely secure, however, and we cannot guarantee absolute security.',
    ],
  },
  {
    heading: 'Children',
    body: [
      'RollWise is not intended for children under 18. We do not knowingly collect personal information from children under 18.',
    ],
  },
  {
    heading: 'Changes and contact',
    body: [
      'We may update this policy from time to time. For questions about your privacy or to make a request, contact us through the platform.',
    ],
  },
];

export function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="June 20, 2026"
      intro="Your privacy matters. This policy describes how RollWise handles your information."
      sections={SECTIONS}
    />
  );
}
