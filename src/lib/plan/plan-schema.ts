/**
 * One period's worth of content per tool call (not the whole plan at once).
 * Keeps each generation short enough for a small local model to produce
 * syntactically valid JSON reliably — asking for every period in a single
 * call let the output run long enough that it would come back malformed.
 */
export const periodTopicsToolSchema = {
  name: "emit_period_topics",
  description: "Submit the topics (and optional milestone) for this one study period.",
  input_schema: {
    type: "object" as const,
    properties: {
      topics: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "short kebab-case slug" },
            title: { type: "string" },
            summary: { type: "string", description: "1 sentence: what this covers and why it's here now" },
            priority: {
              type: "string",
              enum: ["high", "medium", "low"],
              description:
                "high = heavily-weighted / foundational, must not skip. medium = solid value, standard coverage. low = nice-to-have / quick pass only.",
            },
            estimatedHours: { type: "number", description: "Realistic hours to budget for this topic." },
            resources: {
              type: "array",
              minItems: 1,
              maxItems: 1,
              items: {
                type: "object",
                properties: {
                  kind: { type: "string", enum: ["docs", "course", "video", "practice", "book"] },
                  label: { type: "string" },
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
        description: "Optional checkpoint, e.g. 'Full-length mock test'. Omit if this period doesn't need one.",
      },
    },
    required: ["topics"],
  },
};
