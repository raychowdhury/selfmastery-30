import { defineStrategy, daily, everyNDays, fixed, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

export const organizationStrategy = defineStrategy({
  slug: "organization",
  label: "Organize my life",
  defaultTitle: "Get organised and stay that way",
  goalExamples: [
    "Stop losing things and forgetting things",
    "Get the house and the admin under control",
    "Have one place where everything lives",
  ],
  pillars: [
    { name: "Spaces", description: "The physical mess.", icon: "home", sortOrder: 0 },
    { name: "Admin", description: "The paperwork and the inbox.", icon: "inbox", sortOrder: 1 },
    { name: "System", description: "One place where things live.", icon: "list-checks", sortOrder: 2 },
  ],
  actions: [
    {
      id: "one-area",
      pillar: "Spaces",
      minutes: share(0.45, 10, 45),
      cadence: daily,
      priority: 10,
      copy: {
        default: {
          title: "Clear one small area for {m} minutes",
          description: "A drawer, a shelf, a corner. One at a time, finished properly.",
        },
        DEPTH: {
          title: "Clear one area and decide where things live",
          description: "Tidying without a home for things just moves the mess around.",
        },
      },
      minimum: { title: "Clear one surface", minutes: 5 },
    },
    {
      id: "capture",
      pillar: "System",
      minutes: fixed(5),
      cadence: daily,
      priority: 20,
      copy: {
        default: {
          title: "Put everything on your mind into one list",
          description: "One list, one place. The relief comes from it being out of your head.",
        },
      },
      minimum: { title: "Write down the three things nagging you", minutes: 3 },
    },
    {
      id: "admin-block",
      pillar: "Admin",
      minutes: share(0.3, 10, 30),
      cadence: everyNDays(2),
      priority: 40,
      copy: {
        default: {
          title: "Clear {m} minutes of admin",
          description: "The oldest thing on the list first. It is usually the smallest.",
        },
      },
      minimum: { title: "Deal with one piece of admin", minutes: 5 },
    },
    {
      id: "one-decision",
      pillar: "System",
      minutes: fixed(10),
      cadence: everyNDays(3, 1),
      priority: 55,
      copy: {
        default: {
          title: "Give one recurring thing a permanent home",
          description: "Keys, post, chargers, receipts. Decide once, then never again.",
        },
      },
      minimum: { title: "Decide where one thing lives", minutes: 3 },
    },
    planTomorrow("System", "tidy-up"),
    weeklyLook("System", "Do a weekly reset", "Empty the list, tidy one space, look at the week ahead."),
  ],
  milestones: {
    7: { title: "One list, one place", description: "Everything on your mind is written down somewhere you trust." },
    14: { title: "Visible spaces are clear", description: "The rooms you use most no longer add to the load." },
    21: { title: "Admin is current", description: "Nothing important is quietly overdue." },
    30: { title: "A weekly reset that holds", description: "Twenty minutes a week keeps it from rebuilding." },
  },
});
