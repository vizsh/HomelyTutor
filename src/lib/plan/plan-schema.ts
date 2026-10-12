export const planToolSchema = {
  name: "emit_study_periods",
  description:
    "Submit topic allocations for each given study period, once stages and real, verified resources have been researched.",
  input_schema: {
    type: "object" as const,
    properties: {
      periods: {
        type: "array",
        description: "One entry per period id provided in the prompt, in the same order.",
        items: {
          type: "object",
          properties: {
            periodId: { type: "string", description: "Must match a provided period id exactly." },
            topics: {
              type: "array",
              minItems: 1,
              maxItems: 5,
              items: {
                type: "object",
                properties: {
                  id: { type: "string", description: "short kebab-case slug, unique across the whole plan" },
                  title: { type: "string" },
                  summary: {
                    type: "string",
                    description: "1-2 sentences: what this covers and why it's here now",
                  },
                  priority: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description:
                      "high = heavily-weighted / foundational, must not skip. medium = solid value, standard coverage. low = nice-to-have / quick pass only.",
                  },
                  estimatedHours: {
                    type: "number",
                    description: "Realistic hours to budget for this topic within this period.",
                  },
                  resources: {
                    type: "array",
                    minItems: 1,
                    maxItems: 2,
                    items: {
                      type: "object",
                      properties: {
                        kind: { type: "string", enum: ["docs", "course", "video", "practice", "book"] },
                        label: { type: "string" },
                        url: {
                          type: "string",
                          description:
                            "A real URL found via web search for this exact resource. Omit if not verified via search.",
                        },
                      },
                      required: ["kind", "label"],
                    },
                  },
                },
                required: ["id", "title", "summary", "priority", "estimatedHours", "resources"],
              },
            },
            milestone: {
              type: "string",
              description:
                "Optional: a checkpoint for this period, e.g. 'Full-length mock test' or 'Revise weeks 1-3'. Omit most periods; include roughly every 3rd-4th period or near the end.",
            },
          },
          required: ["periodId", "topics"],
        },
      },
    },
    required: ["periods"],
  },
};
