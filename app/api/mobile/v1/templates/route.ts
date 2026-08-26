import { apiOk, handler } from "@/lib/api/http";
import { PUBLIC_TEMPLATES } from "@/lib/plan/templates";

export const GET = handler(async () => {
  return apiOk({
    templates: PUBLIC_TEMPLATES.map((template) => ({
      slug: template.slug,
      name: template.name,
      description: template.description,
      category: template.category,
      group: template.group,
      timeLabel: template.timeLabel,
      suggestedMinutes: template.suggestedMinutes,
      suggestedDifficulty: template.suggestedDifficulty,
      goal: template.goal,
    })),
  });
});
