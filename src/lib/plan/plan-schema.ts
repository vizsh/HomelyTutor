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
            title: {
              type: "string",
              description:
                "A real, specific topic name a student of this subject would recognize — e.g. 'Time Value of Money' or 'The Krebs Cycle'. NEVER a generic placeholder like 'Core topic 1' or 'Week 1 material'.",
            },
            domain: {
              type: "string",
              description:
                "The broad syllabus section/domain this topic belongs to, ONLY if this exam has a known standard structure (a professional certification, standardized test, board syllabus) — e.g. 'Ethical and Professional Standards' for CFA, 'Mechanics' for a physics board exam. Omit entirely for a custom/informal goal with no official syllabus.",
            },
            examWeight: {
              type: "string",
              description:
                "The domain's real published exam weight if you know it (e.g. '15-20%'), or your best realistic estimate if you don't know the exact figure. Omit only if this exam truly has no weighting concept (e.g. a personal skill goal).",
            },
            summary: {
              type: "string",
              description: "1-2 sentences: specifically what this topic covers, not a generic description.",
            },
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
                  label: {
                    type: "string",
                    description: "A real, specific resource name (an actual textbook, course, or doc site) — not 'Syllabus reference material'.",
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
        description: "Optional checkpoint, e.g. 'Full-length mock test'. Omit if this period doesn't need one.",
      },
    },
    required: ["topics"],
  },
};

/**
 * Turns a student's free-text progress update into structured signal the
 * re-plan engine can act on — which real topics (from their own plan) to
 * treat as mastered vs still-struggling, plus any schedule-affecting
 * context in plain language.
 */
export const replanSignalToolSchema = {
  name: "emit_replan_signal",
  description: "Submit what the student's update means for their plan.",
  input_schema: {
    type: "object" as const,
    properties: {
      masteredTopics: {
        type: "array",
        items: { type: "string" },
        description:
          "Exact topic titles, copied verbatim from the provided topic list, that the student says they've finished, understood well, or no longer need time on. Empty array if none mentioned.",
      },
      strugglingTopics: {
        type: "array",
        items: { type: "string" },
        description:
          "Exact topic titles, copied verbatim from the provided topic list, that the student says they're behind on, found hard, or still need more time for. Empty array if none mentioned.",
      },
      circumstances: {
        type: "string",
        description:
          "1-2 plain sentences summarizing any context that should affect the schedule — illness, a busier or freer week, lost motivation, etc. Empty string if the update is purely about specific topics.",
      },
    },
    required: ["masteredTopics", "strugglingTopics", "circumstances"],
  },
};
