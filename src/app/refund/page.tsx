import type { Metadata } from 'next';
import LegalPageShell from '@/components/legal-page-shell';

export const metadata: Metadata = { title: 'Refund Policy' };

export default function RefundPage() {
  return (
    <LegalPageShell title="Refund & Cancellation Policy" updated="June 2026">
      <p>
        We want you to be happy with Scholr Pro. This policy explains how refunds and cancellations work.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">1. 7-Day Refund Guarantee</h2>
      <p>
        If you're not satisfied with Scholr Pro, you can request a full refund within <strong className="text-white">7 days</strong> of
        your purchase, no questions asked. Contact us via the <a href="/contact" className="text-violet-400 hover:text-violet-300 underline">Contact page</a> with
        your registered email and payment reference (visible on your Billing page), and we'll process the refund within 5–7 business days
        to your original payment method via Razorpay.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">2. After 7 Days</h2>
      <p>
        Refund requests made after 7 days from purchase are evaluated on a case-by-case basis. We may offer
        a partial refund or plan extension at our discretion, but it is not guaranteed.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">3. No Auto-Renewal</h2>
      <p>
        Scholr Pro plans are one-time purchases for a fixed term (5 months or 12 months) — we do not
        auto-charge you when your plan expires. You will simply revert to the Free plan unless you choose
        to purchase again.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">4. Cancellation</h2>
      <p>
        Since there is no recurring subscription to cancel, there's nothing to "cancel" — your Pro access
        simply runs until the term you paid for ends. If you'd like to stop using Scholr altogether, you
        can delete your account from Settings at any time; this does not entitle you to a refund for time
        already used beyond the 7-day window above.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">5. Failed or Duplicate Payments</h2>
      <p>
        If you were charged more than once for the same plan due to a technical error, contact us immediately
        with both payment references and we will refund the duplicate charge in full, regardless of the
        7-day window.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">6. How Refunds Are Processed</h2>
      <p>
        All refunds are issued through Razorpay back to your original payment method (UPI, card, or net
        banking). Processing time depends on your bank, typically 5–7 business days after we approve the
        refund.
      </p>

      <h2 className="text-white font-semibold text-base pt-2">7. Contact for Refunds</h2>
      <p>
        To request a refund, visit our <a href="/contact" className="text-violet-400 hover:text-violet-300 underline">Contact page</a> and
        include your registered email and the Razorpay payment ID found on your Billing page.
      </p>
    </LegalPageShell>
  );
}
