import type { Metadata } from 'next';
import LegalPageShell from '@/components/legal-page-shell';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" updated="June 2026">
      <p>
        Welcome to Scholr. By creating an account or using our service, you agree to the following terms.
        Please read them carefully.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">1. The Service</h2>
      <p>
        Scholr is an attendance and study-tracking tool for college students. It offers manual and
        AI-assisted timetable creation, attendance tracking, analytics, and note-taking features.
        We provide the service "as is" and continually improve it, but we don't guarantee uninterrupted
        availability.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">2. Accounts</h2>
      <p>
        You must provide accurate information when registering. You are responsible for keeping your
        password secure and for all activity under your account. You must be old enough to use online
        services under the laws of your country.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">3. Free & Paid Plans</h2>
      <p>
        Scholr offers a Free plan and a Pro plan (₹149/semester or ₹249/year). Pro unlocks unlimited AI
        timetable parsing, photo notes, and PDF export. Plan prices may change with notice; existing
        active subscriptions are honored until expiry.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">4. Payments</h2>
      <p>
        Payments are processed securely via Razorpay. We do not store your card or banking details.
        Subscriptions are one-time purchases for a fixed term (not auto-renewing) unless stated otherwise
        at checkout. See our <a href="/refund" className="text-violet-400 hover:text-violet-300 underline">Refund Policy</a> for cancellation terms.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Use the service for any unlawful purpose</li>
        <li>Attempt to reverse-engineer, scrape, or abuse our API or AI parsing endpoints</li>
        <li>Upload content that infringes others' copyrights or contains malicious code</li>
        <li>Share your account credentials with others</li>
      </ul>

      <h2 className="text-white font-semibold text-base pt-2">6. AI-Generated Content</h2>
      <p>
        Our AI timetable parser uses Anthropic's Claude API to interpret uploaded images. While we strive
        for accuracy, AI-extracted schedules may contain errors. Always review parsed data before confirming
        your timetable. Scholr is not liable for attendance miscalculations resulting from incorrect AI
        parsing that was not corrected by the user.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">7. Data Ownership</h2>
      <p>
        You retain ownership of all timetable data, notes, and photos you upload. We retain the right to
        store and process this data solely to provide the service to you.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">8. Termination</h2>
      <p>
        You may delete your account at any time. We reserve the right to suspend accounts that violate
        these terms or engage in abusive behavior toward our systems or other users.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">9. Limitation of Liability</h2>
      <p>
        Scholr is a study aid tool, not an official attendance record. Always verify your attendance
        status with your institution's official records. We are not liable for academic consequences
        arising from reliance on Scholr's calculations.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">10. Changes to Terms</h2>
      <p>
        We may update these terms periodically. Material changes will be communicated via the app or email.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">11. Contact</h2>
      <p>
        Questions? Visit our <a href="/contact" className="text-violet-400 hover:text-violet-300 underline">Contact page</a>.
      </p>
    </LegalPageShell>
  );
}
