import { LegalPage, type LegalSection } from './LegalPage';

const SECTIONS: LegalSection[] = [
  {
    heading: 'About RollWise',
    body: [
      'RollWise is an online marketplace that connects students with independent Brazilian Jiu-Jitsu coaches for private and small-group sessions. RollWise provides the platform; it does not itself provide coaching, training, or instruction.',
      'By creating an account or using RollWise, you agree to these Terms of Service. If you do not agree, do not use the platform.',
    ],
  },
  {
    heading: 'Eligibility and accounts',
    body: [
      'You must be at least 18 years old (or have the consent of a parent or legal guardian) to use RollWise. You agree to provide accurate information and to keep your account credentials secure.',
      'You are responsible for all activity that occurs under your account. Notify us immediately of any unauthorized use.',
    ],
  },
  {
    heading: 'Coaches are independent',
    body: [
      'Coaches on RollWise are independent service providers, not employees or agents of RollWise. They are solely responsible for the sessions they offer, their qualifications, conduct, safety practices, and any required licenses or insurance.',
      'A "Verified" badge indicates that a coach submitted credentials we reviewed; it is not a guarantee or endorsement of their services, and you are responsible for assessing whether a coach is right for you.',
    ],
  },
  {
    heading: 'Bookings and payments',
    body: [
      'Coaches set their own prices. When you book a session, you authorize payment of the listed amount through our payment processor, Stripe. RollWise retains a platform fee, and the remainder is paid out to the coach.',
      'You agree to attend booked sessions and to communicate with your coach about scheduling. RollWise is not responsible for the conduct of any user.',
    ],
  },
  {
    heading: 'Cancellations and refunds',
    body: [
      'Refunds may be issued in limited circumstances — for example, if a session you paid for is unavailable or oversubscribed. Where a refund is issued, the corresponding booking is cancelled.',
      'Coaches and students are expected to honor confirmed bookings. Disputes about a specific session should first be raised with the coach.',
    ],
  },
  {
    heading: 'Assumption of risk',
    body: [
      'Brazilian Jiu-Jitsu is a physical contact activity that carries an inherent risk of injury. You participate voluntarily and at your own risk. To the fullest extent permitted by law, you assume all risks associated with any session booked through RollWise.',
      'You should consult a physician before beginning any new physical activity.',
    ],
  },
  {
    heading: 'Acceptable use',
    body: [
      'You agree not to misuse the platform, including by providing false information, attempting to bypass payments, harassing other users, infringing intellectual property, or interfering with the operation or security of the service.',
    ],
  },
  {
    heading: 'Disclaimers and limitation of liability',
    body: [
      'The platform is provided "as is" without warranties of any kind. To the fullest extent permitted by law, RollWise is not liable for any indirect, incidental, or consequential damages, or for the acts or omissions of coaches or students.',
    ],
  },
  {
    heading: 'Termination',
    body: [
      'We may suspend or terminate accounts that violate these Terms or that we reasonably believe pose a risk to other users or to the platform.',
    ],
  },
  {
    heading: 'Changes and contact',
    body: [
      'We may update these Terms from time to time; continued use of RollWise after changes take effect constitutes acceptance. For questions about these Terms, contact us through the platform.',
    ],
  },
];

export function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="June 20, 2026"
      intro="These terms govern your use of RollWise. Please read them carefully."
      sections={SECTIONS}
    />
  );
}
