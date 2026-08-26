import type { Metadata } from "next";

import { DraftNotice } from "@/components/marketing/draft-notice";
import { LegalPage, Placeholder, Section } from "@/components/marketing/legal-page";
import { isPlaceholder, OPERATOR } from "@/lib/content/legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that apply to using SelfMastery.",
};

function Detail({ value }: { value: string }) {
  return isPlaceholder(value) ? <Placeholder>{value}</Placeholder> : <>{value}</>;
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated={OPERATOR.effectiveDate}
      intro="SelfMastery is a planning and tracking tool. It is not a medical, therapeutic, financial or legal service."
    >
      <DraftNotice />

      <Section title="1. Who these terms are with">
        <p>
          SelfMastery is provided by <Detail value={OPERATOR.legalEntity} />,{" "}
          <Detail value={OPERATOR.address} /> (“we”, “us”). By creating an
          account or using the app, you agree to these terms. If you do not
          agree, please do not use SelfMastery.
        </p>
      </Section>

      <Section title="2. What SelfMastery is">
        <p>
          You choose one goal; SelfMastery suggests a small set of general,
          everyday actions over thirty days and keeps a record of what you
          complete.
        </p>
        <p>
          <strong>It is a planning and tracking tool, nothing more.</strong> It
          does not provide professional services of any kind — see section 6.
        </p>
      </Section>

      <Section title="3. Your account">
        <p>You need an account. You agree to:</p>
        <ul>
          <li>Provide an email address you control</li>
          <li>Keep your password confidential</li>
          <li>Be responsible for activity under your account</li>
          <li>
            Tell us promptly at <Detail value={OPERATOR.supportEmail} /> if you
            suspect unauthorised access
          </li>
        </ul>
        <p>
          You must be at least {OPERATOR.minimumAge} years old. You can delete
          your account at any time from <strong>Profile → Delete account</strong>.
          Deletion is permanent.
        </p>
      </Section>

      <Section title="4. Acceptable use">
        <p>Do not:</p>
        <ul>
          <li>Break the law, or use the app to harm anyone</li>
          <li>Attempt to access another person&apos;s account or data</li>
          <li>Probe, scan or disrupt the service or its infrastructure</li>
          <li>
            Automate access, scrape, or use the API outside the app without
            permission
          </li>
          <li>Circumvent rate limits or security controls</li>
          <li>Resell or redistribute the service</li>
        </ul>
        <p>We may suspend or terminate accounts that do these things.</p>
      </Section>

      <Section title="5. Your content">
        <p>
          The goals, reasons, reflections and notes you write remain{" "}
          <strong>yours</strong>. You keep all rights to them.
        </p>
        <p>
          You grant us only the narrow licence needed to run the service: to
          store, process and display that content back to you. We do not publish
          it, share it, sell it, or use it to train machine-learning models. It
          is deleted when you delete your account.
        </p>
      </Section>

      <Section title="6. Important disclaimers">
        <p>
          <strong>General.</strong> SelfMastery does not guarantee any outcome.
          Whether anything changes over thirty days depends on you and on
          circumstances outside our control. Nothing in the app or its marketing
          is a promise of results.
        </p>
        <p>
          <strong>Health and fitness.</strong> SelfMastery is not a medical
          device and not a healthcare service. It does not diagnose, treat, cure
          or prevent anything, and gives no medical, dietary, physiotherapeutic
          or mental-health advice. Suggestions are general and behavioural — for
          example “walk for twenty minutes” — and are not personalised to your
          medical history. Consult a qualified healthcare professional before
          starting new physical activity, changing your diet, or acting on
          anything concerning your physical or mental health. In an emergency,
          contact your local emergency services.
        </p>
        <p>
          <strong>Money.</strong> SelfMastery is not a financial adviser and is
          not regulated as one. Money goals produce organisational prompts —
          recording spending, reviewing a category, checking upcoming bills. It
          gives no investment, tax, debt, insurance or financial-product advice.
        </p>
        <p>
          <strong>Legal.</strong> Nothing in SelfMastery is legal advice.
        </p>
      </Section>

      <Section title="7. Availability">
        <p>
          We aim to keep SelfMastery running but do not guarantee uninterrupted
          availability, and we may modify, suspend or discontinue features. If we
          discontinue the service entirely, we will give reasonable notice and a
          way to export or delete your data. The app requires an internet
          connection.
        </p>
      </Section>

      <Section title="8. Price">
        <p>
          SelfMastery is currently free. If paid features are introduced,
          existing functionality that you already rely on will not be moved
          behind a paywall without notice.
        </p>
      </Section>

      <Section title="9. Termination">
        <p>
          You may stop using SelfMastery and delete your account at any time. We
          may suspend or terminate your account if you breach these terms, or if
          we are required to by law. Where reasonable and lawful, we will tell
          you why.
        </p>
      </Section>

      <Section title="10. Liability">
        <p>
          To the fullest extent permitted by law, SelfMastery is provided “as is”
          without warranties of any kind. We are not liable for indirect,
          incidental or consequential losses, or for any loss arising from
          actions you chose to take.
        </p>
        <p>
          Nothing in these terms excludes liability that cannot lawfully be
          excluded — including for death or personal injury caused by
          negligence, or for fraud.
        </p>
      </Section>

      <Section title="11. Changes">
        <p>
          We may update these terms. Material changes will be notified in the app
          or by email before taking effect. Continuing to use SelfMastery
          afterwards means you accept them.
        </p>
      </Section>

      <Section title="12. Governing law">
        <p>
          These terms are governed by the laws of{" "}
          <Detail value={OPERATOR.jurisdiction} />, and disputes are subject to
          its courts — subject to any mandatory consumer rights in your country
          of residence.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>
          <Detail value={OPERATOR.legalEntity} />
          <br />
          <Detail value={OPERATOR.address} />
          <br />
          <Detail value={OPERATOR.supportEmail} />
        </p>
      </Section>
    </LegalPage>
  );
}
