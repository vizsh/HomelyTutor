export const quizToolSchema = {
  name: "emit_quiz",
  description: "Submit the final set of quiz questions once they're ready.",
  input_schema: {
    type: "object" as const,
    properties: {
      topic: {
        type: "string",
        description: "A short, clean restatement of what's being tested.",
      },
      questions: {
        type: "array",
        minItems: 5,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "short kebab-case slug, unique per question" },
            question: { type: "string" },
            options: {
              type: "array",
              minItems: 4,
              maxItems: 4,
              items: { type: "string" },
              description: "Exactly 4 answer options, plausible distractors, no 'all of the above'.",
            },
            correctIndex: {
              type: "integer",
              minimum: 0,
              maximum: 3,
              description: "Index (0-3) of the correct option.",
            },
            explanation: {
              type: "string",
              description: "1-2 sentences: why that answer is correct, said directly to the learner.",
            },
          },
          required: ["id", "question", "options", "correctIndex", "explanation"],
        },
      },
    },
    required: ["topic", "questions"],
  },
};
