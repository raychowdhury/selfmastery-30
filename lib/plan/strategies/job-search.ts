import { defineStrategy, everyNDays, fixed, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

/**
 * A job search is a sequence, not a habit. The heavy lifting here is the
 * SequenceTemplate: résumé, then profile, then targets, then applications,
 * then networking, then interview prep, then follow-ups.
 */
export const jobSearchStrategy = defineStrategy({
  slug: "job-search",
  label: "Find a better job",
  defaultTitle: "Find a better job",
  goalExamples: [
    "Get interviews for roles I actually want",
    "Apply consistently instead of in bursts",
    "Be ready when the right role appears",
  ],
  pillars: [
    { name: "Search", description: "Moving the process forward, stage by stage.", icon: "briefcase", sortOrder: 0 },
    { name: "Outreach", description: "Talking to people, not just portals.", icon: "users", sortOrder: 1 },
    { name: "Planning", description: "Keeping the search organised.", icon: "list-checks", sortOrder: 2 },
  ],
  sequences: [
    {
      id: "search-track",
      pillar: "Search",
      minutes: { kind: "share", share: 0.55, min: 20, max: 90 },
      priority: 10,
      stages: [
        {
          title: "Rewrite the top third of your CV",
          description: "The part a recruiter reads in ten seconds. Concrete results, not responsibilities.",
          minimum: "Fix one bullet point on your CV",
        },
        {
          title: "Finish your CV and export a clean copy",
          description: "One page if you can. Save it somewhere you can send it from your phone.",
          minimum: "Fix one section of your CV",
        },
        {
          title: "Update your professional profile",
          description: "Headline, summary, and the last two roles. Match the language of jobs you want.",
          minimum: "Update your headline",
        },
        {
          title: "Build a list of 20 target companies",
          description: "Places you would genuinely like to work, not just places that are hiring.",
          minimum: "Add three companies to your list",
        },
        {
          title: "Apply to your first roles",
          description: "Two or three, properly tailored. Quality over volume, always.",
          minimum: "Send one application",
        },
        {
          title: "Apply and tailor each cover note",
          description: "Two sentences on why this company specifically. That is the whole trick.",
          minimum: "Send one application",
        },
        {
          title: "Prepare your answers to the five obvious questions",
          description: "Why you, why them, your biggest project, a failure, and your questions for them.",
          minimum: "Prepare one answer",
        },
        {
          title: "Practise interviewing out loud",
          description: "Out loud, not in your head. It is a different skill.",
          minimum: "Answer one question out loud",
        },
        {
          title: "Follow up on everything outstanding",
          description: "A short, polite nudge. Most people never send it.",
          minimum: "Send one follow-up message",
        },
        {
          title: "Keep applying and close the loop",
          description: "Applications out, follow-ups in, list updated.",
          minimum: "Send one application or follow-up",
        },
      ],
    },
  ],
  actions: [
    {
      id: "outreach",
      pillar: "Outreach",
      minutes: share(0.25, 10, 30),
      cadence: everyNDays(3, 1),
      priority: 30,
      copy: {
        default: {
          title: "Reach out to one person",
          description: "Someone doing the job you want. Ask one specific question.",
        },
        FINISH: {
          title: "Follow up with someone you already contacted",
          description: "Warm contacts convert far better than cold applications.",
        },
      },
      minimum: { title: "Send one short message", minutes: 5 },
    },
    {
      id: "track",
      pillar: "Planning",
      minutes: fixed(10),
      cadence: everyNDays(2),
      priority: 60,
      copy: {
        default: {
          title: "Update your application tracker",
          description: "Where each role stands and what the next step is. A spreadsheet is fine.",
        },
      },
      minimum: { title: "Log today's activity", minutes: 3 },
    },
    planTomorrow("Planning", "search block"),
    weeklyLook("Planning", "Review the week's search", "Applications sent, replies received, and what to change."),
  ],
  milestones: {
    7: { title: "Your CV is ready to send", description: "No more editing it the night before an application." },
    14: { title: "Profile updated and targets chosen", description: "You know where you are aiming." },
    21: { title: "Applications going out consistently", description: "A steady flow rather than an occasional burst." },
    30: { title: "A live pipeline", description: "Applications out, conversations happening, follow-ups done." },
  },
});
