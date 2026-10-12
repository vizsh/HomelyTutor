export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type QuizSet = {
  topic: string;
  questions: QuizQuestion[];
};
