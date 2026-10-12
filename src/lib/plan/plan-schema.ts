export const planToolSchema = {
  name: "emit_learning_plan",
  description:
    "Submit the final structured learning plan once stages and real, verified resources have been researched.",
  input_schema: {
    type: "object" as const,
    properties: {
      goal: {
        type: "string",
        description: "A short, clean restatement of what the user wants to learn.",
      },
      totalDurationLabel: {
        type: "string",
        description: "A realistic total-time estimate, e.g. '~6-8 weeks to first competence'.",
      },
      stages: {
        type: "array",
        minItems: 3,
        maxItems: 7,
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "short kebab-case slug" },
            title: { type: "string" },
            summary: {
              type: "string",
              description: "1-2 sentences: what this stage covers and why it's positioned here",
            },
            durationLabel: { type: "string", description: "e.g. 'Week 1' or 'Weeks 2-3'" },
            resources: {
              type: "array",
              minItems: 1,
              maxItems: 3,
              items: {
                type: "object",
                properties: {
                  kind: {
                    type: "string",
                    enum: ["docs", "course", "video", "practice", "book"],
                  },
                  label: { type: "string", description: "short, human name of the resource" },
                  url: {
                    type: "string",
                    description:
                      "A real URL found via web search for this exact resource. Omit if you did not verify it via search.",
                  },
                },
                required: ["kind", "label"],
              },
            },
          },
          required: ["id", "title", "summary", "durationLabel", "resources"],
        },
      },
    },
    required: ["goal", "totalDurationLabel", "stages"],
  },
};
