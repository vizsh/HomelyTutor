import type { QuizSet } from "./types";

/**
 * Fallback generator — used when Ollama isn't reachable, or the real
 * generation call fails. Deliberately topic-agnostic (study-skill
 * questions, not invented domain facts) so it never presents a wrong
 * "fact" about the user's actual topic as correct.
 */
export async function generateMockQuiz(topic: string): Promise<QuizSet> {
  const display = topic.trim().length > 0 ? topic.trim() : "this topic";

  return {
    topic: display,
    questions: [
      {
        id: "spacing",
        question: `You've just read a dense explanation about ${display}. What's the most effective next step for retention?`,
        options: [
          "Re-read the same material immediately",
          "Close it and try to recall the key points from memory",
          "Highlight the important sentences",
          "Move on to a different topic right away",
        ],
        correctIndex: 1,
        explanation:
          "Active recall — retrieving information from memory rather than re-reading — is consistently shown to build stronger retention than passive review.",
      },
      {
        id: "spaced-repetition",
        question: "You learn something new today. When should you review it to retain it longest?",
        options: [
          "Never again, once is enough",
          "Immediately, over and over, in one sitting",
          "At increasing intervals — e.g. tomorrow, then a few days, then a week",
          "Exactly 24 hours later only",
        ],
        correctIndex: 2,
        explanation:
          "Spaced repetition — reviewing at growing intervals — is one of the most reliable findings in learning research for long-term retention.",
      },
      {
        id: "testing-effect",
        question: `Which habit will build real skill in ${display} fastest?`,
        options: [
          "Only consuming more material (articles, videos, courses)",
          "Regularly testing yourself and correcting mistakes",
          "Taking detailed notes without reviewing them",
          "Watching others do it without practicing yourself",
        ],
        correctIndex: 1,
        explanation:
          "The testing effect: the act of retrieving and being corrected builds durable skill far more than passive consumption does.",
      },
      {
        id: "interleaving",
        question: "When practicing several related sub-skills, what tends to work best?",
        options: [
          "Mastering one sub-skill completely before touching the next",
          "Mixing (interleaving) sub-skills within the same session",
          "Avoiding practice until you feel fully ready",
          "Practicing only the parts that already feel easy",
        ],
        correctIndex: 1,
        explanation:
          "Interleaving — mixing related skills in practice rather than blocking them — improves your ability to tell them apart and apply the right one later.",
      },
      {
        id: "feedback",
        question: "You get a practice question wrong. What should happen next for it to actually help you?",
        options: [
          "Skip the explanation and move to the next question",
          "Read why it was wrong and explain the correct reasoning back to yourself",
          "Mark it as 'too hard' and avoid similar questions",
          "Guess again randomly until you get it right",
        ],
        correctIndex: 1,
        explanation:
          "Feedback only improves learning when it's actually processed — explaining the correction back to yourself closes the loop.",
      },
    ],
  };
}
