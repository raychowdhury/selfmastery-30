import Link from "next/link";
import type { Metadata } from "next";

import styles from "./welcome.module.css";

export const metadata: Metadata = {
  title: "Start your 30 days",
  description: "One goal. Three small actions a day. Thirty days.",
};

/**
 * The Calm landing — the app's cold open, ported straight from the
 * "SelfMastery 30 Calm App" prototype (docs/design). One screen, one promise:
 * the outlined 30, a thirty-dot rail, the headline, and the two actions pinned
 * to the bottom. It reads from the shared design tokens, so it is Nocturne in
 * dark and Modernist in light with no per-theme markup.
 */
export default function WelcomePage() {
  // Eight of thirty filled, matching the prototype's "Day 8" state.
  const dots = Array.from({ length: 30 }, (_, i) => i < 8);

  return (
    <main className={styles.frame}>
      <div className={styles.content}>
        <div className={styles.eyebrow}>SelfMastery</div>

        <div className={styles.markWrap}>
          <div className={styles.glow} aria-hidden />
          <div className={styles.mark} aria-hidden>
            30
          </div>
        </div>

        <div className={styles.dots} aria-hidden>
          {dots.map((filled, i) => (
            <span
              key={i}
              className={filled ? styles.dotOn : styles.dotOff}
              style={{ animationDelay: `${i * 35}ms` }}
            />
          ))}
        </div>

        <h1 className={styles.headline}>
          Become the person you keep saying you want to be.
        </h1>
        <p className={styles.sub}>
          One goal. Three small actions a day. Thirty days.
        </p>
      </div>

      <div className={styles.bar}>
        <Link href="/onboarding" className={styles.primary}>
          Start my 30 days
        </Link>
        <Link href="/sign-in" className={styles.ghost}>
          I already have an account
        </Link>
      </div>
    </main>
  );
}
