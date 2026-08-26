import { defineStrategy, everyNDays, fixed, phoneBoundary, planTomorrow, share, weeklyLook } from "@/lib/plan/strategies/shared";

/**
 * DEMO DATA ONLY.
 *
 * This exists to make one architectural point: a highly specific, technical
 * 30-day path is just another content file. No schema change, no branching in
 * the UI, no privileged position in the product. SelfMastery is not a developer
 * tool — this is one template out of eighteen, and it is flagged `isDemo` so it
 * stays out of the public template list.
 */
export const demoAiBackendStrategy = defineStrategy({
  slug: "demo-ai-backend",
  label: "AI & backend engineering",
  defaultTitle: "Become a stronger AI/backend engineer",
  goalExamples: ["Become a stronger AI/backend engineer"],
  pillars: [
    { name: "Build", description: "Writing and shipping the code.", icon: "terminal", sortOrder: 0 },
    { name: "Depth", description: "Understanding what you are building on.", icon: "lightbulb", sortOrder: 1 },
    { name: "Planning", description: "Knowing the next step.", icon: "list-checks", sortOrder: 2 },
  ],
  sequences: [
    {
      id: "engineering-track",
      pillar: "Build",
      minutes: { kind: "share", share: 0.6, min: 25, max: 100 },
      priority: 10,
      stages: [
        { title: "Python: write one small script from scratch", description: "No framework. Types, a couple of functions, and a test.", minimum: "Write one function with a test" },
        { title: "FastAPI: stand up an endpoint and a schema", description: "One route, one Pydantic model, running locally.", minimum: "Get one endpoint returning JSON" },
        { title: "PostgreSQL: model the data and query it", description: "A migration, an index, and a query you understand the plan for.", minimum: "Write one migration" },
        { title: "Authentication: protect the endpoint", description: "Hash properly, sign a token, verify it on the way back in.", minimum: "Hash and verify one password" },
        { title: "Redis: add a cache and measure it", description: "Cache one expensive read. Record the before and after.", minimum: "Cache one value" },
        { title: "Background jobs: move work off the request", description: "One queued task, with a retry and a failure path.", minimum: "Queue one job" },
        { title: "Docker: make it run anywhere", description: "A Dockerfile and a compose file that a stranger could start.", minimum: "Write the Dockerfile" },
        { title: "Testing and logging: make failure legible", description: "Tests around the risky path, structured logs around the rest.", minimum: "Write one test" },
        { title: "LLM integration: add a model call that earns its place", description: "One prompt, validated output, and a fallback when it fails.", minimum: "Make one model call" },
        { title: "RAG: retrieve before you generate", description: "Chunk, embed, retrieve, cite. Measure whether it actually helped.", minimum: "Embed one document" },
        { title: "System design: write the diagram down", description: "Boundaries, data flow, and the three things most likely to break.", minimum: "Sketch one boundary" },
        { title: "Deploy it and write the README", description: "Public URL, environment documented, one command to run it.", minimum: "Take one step toward deploying" },
      ],
    },
  ],
  actions: [
    {
      id: "read-source",
      pillar: "Depth",
      minutes: share(0.25, 15, 30),
      cadence: everyNDays(2),
      priority: 25,
      copy: {
        default: {
          title: "Read the actual documentation for {m} minutes",
          description: "The source, not a tutorial about the source.",
        },
      },
      minimum: { title: "Read one section of the docs", minutes: 10 },
    },
    {
      id: "write-up",
      pillar: "Depth",
      minutes: fixed(10),
      cadence: everyNDays(3, 1),
      optional: true,
      priority: 70,
      copy: {
        default: {
          title: "Write down what you learned today",
          description: "Two lines. It becomes your own reference, and it exposes the gaps.",
        },
      },
      minimum: { title: "Write one line", minutes: 3 },
    },
    phoneBoundary("Build"),
    planTomorrow("Planning", "build session"),
    weeklyLook("Planning", "Review the week's code", "What shipped, what is half-finished, what is next?"),
  ],
  milestones: {
    7: { title: "A running service", description: "Python, FastAPI and Postgres, working end to end locally." },
    14: { title: "It is production-shaped", description: "Auth, caching and background work are in place." },
    21: { title: "Containerised and tested", description: "It runs anywhere, and failures are visible." },
    30: { title: "Deployed, with an LLM feature that earns its place", description: "Public, documented, and explainable." },
  },
});
