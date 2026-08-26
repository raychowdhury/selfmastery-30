import type { Metadata } from "next";

import { DraftNotice } from "@/components/marketing/draft-notice";
import { LegalPage, Placeholder, Section } from "@/components/marketing/legal-page";
import { isPlaceholder, OPERATOR, PROCESSORS } from "@/lib/content/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What SelfMastery collects, why, and how to delete it.",
};

/** Renders an operator value, highlighting it while it is still a placeholder. */
function Detail({ value }: { value: string }) {
  return isPlaceholder(value) ? <Placeholder>{value}</Placeholder> : <>{value}</>;
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={OPERATOR.effectiveDate}
      intro="SelfMastery collects only what the service needs to work. There is no advertising, no tracking, and no third-party analytics."
    >
      <DraftNotice />

      <Section title="Who we are">
        <p>
          SelfMastery is operated by <Detail value={OPERATOR.legalEntity} />,{" "}
          <Detail value={OPERATOR.address} />.
        </p>
        <p>
          Questions about this policy or your data:{" "}
          <Detail value={OPERATOR.privacyEmail} />.
        </p>
      </Section>

      <Section title="What we collect">
        <p>
          <strong>Information you give us.</strong> Your email address, so we can
          identify your account, sign you in and send password resets. The name
          you choose to be called. Your password — stored only as a bcrypt hash,
          so we never see or store the password itself.
        </p>
        <p>
          <strong>What you write.</strong> Your goal and why it matters, your Day
          30 success definition, the time you have available, the obstacles you
          identify, your daily reflections and notes, weekly review answers, and
          any priorities you add.
        </p>
        <p>
          <strong>What the app records as you use it.</strong> Which actions you
          complete and when, which days used a Minimum Day, which days you
          finished, and the adjustments made to your plan along with the reasons
          for them.
        </p>
        <p>
          <strong>Stored only on your device.</strong> Your theme choice and
          reminder settings never reach us. Your session token is held in the
          iOS Keychain.
        </p>
      </Section>

      <Section title="What we do not collect">
        <p>
          We do not collect location, contacts, photos, camera or microphone
          data, health or fitness measurements, financial account details,
          advertising identifiers, or any cross-app or cross-site activity.
        </p>
        <p>
          Two are worth stating plainly, because the goals we support might
          suggest otherwise. A fitness goal produces text like “Walk for 20
          minutes” — there is no measurement and no HealthKit. A money goal
          produces prompts like “Record what you spent today” — we never see
          amounts, accounts or institutions.
        </p>
        <p>
          We do not ask for App Tracking Transparency permission, because we do
          not track.
        </p>
      </Section>

      <Section title="About your reflections">
        <p>
          Your reflections, goals and reasons are the most personal thing
          SelfMastery holds, and we treat them accordingly:
        </p>
        <ul>
          <li>They are shown back only to you.</li>
          <li>They are never sold, shared or published.</li>
          <li>They are not used to train machine-learning models.</li>
          <li>Their contents are not written to our application logs.</li>
          <li>They are permanently deleted when you delete your account.</li>
        </ul>
      </Section>

      <Section title="Who we share it with">
        <p>
          We do not sell your data and we do not share it for advertising. We use
          these processors to run the service:
        </p>
        <table>
          <thead>
            <tr>
              <th>Processor</th>
              <th>Purpose</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {PROCESSORS.map((processor) => (
              <tr key={processor.name}>
                <td>
                  <Detail value={processor.name} />
                </td>
                <td>{processor.purpose}</td>
                <td>{processor.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          We may also disclose data where legally required, or to protect the
          rights and safety of our users.
        </p>
      </Section>

      <Section title="Security">
        <ul>
          <li>All traffic uses HTTPS.</li>
          <li>Passwords are hashed with bcrypt and never stored in plain text.</li>
          <li>
            Session tokens are stored hashed on our servers and in the Keychain
            on your device, so a database leak does not hand over live sessions.
          </li>
          <li>
            Signing out revokes that device&apos;s token. Changing your password
            revokes every session.
          </li>
          <li>Every request is checked against the account that owns the data.</li>
        </ul>
        <p>No system is perfectly secure, and we do not claim otherwise.</p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Your data is kept while your account exists. When you delete your
          account it is deleted immediately and permanently. Backups containing
          your data are overwritten on their normal rotation of{" "}
          <Detail value={OPERATOR.backupRetention} />.
        </p>
      </Section>

      <Section title="Deleting your account">
        <p>
          You can delete your account at any time from inside the app:{" "}
          <strong>Profile → Delete account</strong>.
        </p>
        <p>
          You will be shown exactly what is removed and asked to confirm with
          your password. Deletion removes your account and all associated data —
          challenges, daily actions, completion history, reflections, weekly
          reviews and sessions.
        </p>
        <p>
          It is permanent, immediate, and cannot be undone. There is no
          deactivation alternative, and you do not need to contact us to do it.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct,
          delete, restrict or object to processing, and to data portability, as
          well as the right to complain to a supervisory authority (
          <Detail value={OPERATOR.supervisoryAuthority} />
          ).
        </p>
        <p>
          To exercise any of these, email{" "}
          <Detail value={OPERATOR.privacyEmail} />. Deletion is available
          immediately in the app without contacting us.
        </p>
      </Section>

      <Section title="Children">
        <p>
          SelfMastery is not directed at children under {OPERATOR.minimumAge},
          and we do not knowingly collect their data. If you believe a child has
          created an account, contact{" "}
          <Detail value={OPERATOR.privacyEmail} /> and we will delete it.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If this policy changes materially we will update the date above and
          notify you in the app or by email before the change takes effect.
        </p>
      </Section>
    </LegalPage>
  );
}
