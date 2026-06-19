import type { Metadata } from 'next';
import LegalPageShell from '@/components/legal-page-shell';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" updated="June 2026">
      <p>
        Scholr ("we", "our", "us") respects your privacy. This policy explains what data we collect,
        why we collect it, and how we protect it.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">1. Information We Collect</h2>
      <p>When you use Scholr, we collect:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Account information: name, email address, and password (encrypted) or Google profile data if you sign in with Google.</li>
        <li>Timetable data: subjects, class timings, and the photos you upload for AI parsing.</li>
        <li>Attendance records: present/absent/holiday status you mark for each class session.</li>
        <li>Notes and photos: any text notes or images you attach to class sessions.</li>
        <li>Payment information: processed entirely by Razorpay. We never see or store your card, UPI, or bank details.</li>
      </ul>

      <h2 className="text-white font-semibold text-base pt-2">2. How We Use Your Information</h2>
      <p>
        We use your data solely to provide the Scholr service: generating your class schedule, calculating
        attendance percentages, storing your notes, and processing AI timetable parsing requests through
        Anthropic's Claude API. Timetable images sent for AI parsing are processed by Anthropic and are not
        used to train their models per their API terms.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">3. Data Storage & Security</h2>
      <p>
        Your data is stored in a PostgreSQL database with industry-standard encryption in transit (TLS).
        Passwords are hashed using bcrypt and are never stored in plain text. We do not sell, rent, or share
        your personal data with third parties for marketing purposes.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">4. Third-Party Services</h2>
      <p>We rely on the following third-party processors, each governed by their own privacy policies:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Anthropic (Claude API) — for AI timetable parsing</li>
        <li>Razorpay — for payment processing</li>
        <li>Google — for optional sign-in via Google OAuth</li>
        <li>Vercel / Neon — for hosting and database infrastructure</li>
      </ul>

      <h2 className="text-white font-semibold text-base pt-2">5. Your Rights</h2>
      <p>
        You may access, update, or delete your account data at any time from Settings. To request full account
        deletion including all timetable, attendance, and note data, contact us at the email below.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">6. Children's Privacy</h2>
      <p>
        Scholr is intended for college students (typically 17+). We do not knowingly collect data from
        children under 13.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">7. Changes to This Policy</h2>
      <p>
        We may update this policy occasionally. Continued use of Scholr after changes constitutes acceptance
        of the revised policy.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">8. Contact</h2>
      <p>
        Questions about this policy? Reach us at the email listed on our <a href="/contact" className="text-violet-400 hover:text-violet-300 underline">Contact page</a>.
      </p>
    </LegalPageShell>
  );
}
