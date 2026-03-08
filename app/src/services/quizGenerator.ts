import type { ExtractedContent } from "./documentProcessor";
import type { Question, QuizType } from "@/types";

export interface QuizGenerationOptions {
  questionCount: number;
  quizType: QuizType;
  includeDefinitions: boolean;
  includeFillBlanks: boolean;
  includeKeywords: boolean;
  includeMultipleChoice: boolean;
}

const defaultOptions: QuizGenerationOptions = {
  questionCount: 10,
  quizType: "quiz",
  includeDefinitions: true,
  includeFillBlanks: true,
  includeKeywords: true,
  includeMultipleChoice: true,
};

export const generateQuiz = (
  content: ExtractedContent,
  options: Partial<QuizGenerationOptions> = {},
): Omit<Question, "id" | "quizId">[] => {
  const opts = { ...defaultOptions, ...options };
  const questions: Omit<Question, "id" | "quizId">[] = [];

  // Validate content
  if (!content || !content.text || content.text.trim().length < 50) {
    console.warn("Insufficient content for quiz generation");
    return [];
  }

  if (!content.sentences || content.sentences.length === 0) {
    console.warn("No sentences found in content");
    return [];
  }

  if (!content.keywords || content.keywords.length === 0) {
    console.warn("No keywords found in content");
  }

  if (opts.includeDefinitions) {
    console.log("Generating definition questions...");
    const definitionQuestions = generateDefinitionQuestions(content);
    console.log("Definition questions generated:", definitionQuestions.length);
    questions.push(...definitionQuestions);
  }

  if (opts.includeFillBlanks) {
    console.log("Generating fill-in-the-blank questions...");
    const fillBlankQuestions = generateFillBlankQuestions(content);
    console.log("Fill-blank questions generated:", fillBlankQuestions.length);
    questions.push(...fillBlankQuestions);
  }

  if (opts.includeKeywords) {
    console.log("Generating keyword questions...");
    const keywordQuestions = generateKeywordQuestions(content);
    console.log("Keyword questions generated:", keywordQuestions.length);
    questions.push(...keywordQuestions);
  }

  if (opts.includeMultipleChoice) {
    console.log("Generating multiple choice questions...");
    const mcQuestions = generateMultipleChoiceQuestions(content);
    console.log("Multiple choice questions generated:", mcQuestions.length);
    questions.push(...mcQuestions);
  }

  if (questions.length === 0) {
    console.warn("No questions could be generated from content");
    return [];
  }

  const shuffled = shuffleArray(questions);
  console.log(
    "DEBUG: shuffled type:",
    typeof shuffled,
    Array.isArray(shuffled),
    shuffled,
  );
  return Array.isArray(shuffled) ? shuffled.slice(0, opts.questionCount) : [];
};

const generateDefinitionQuestions = (
  content: ExtractedContent,
): Omit<Question, "id" | "quizId">[] => {
  const questions: Omit<Question, "id" | "quizId">[] = [];
  const definitionPatterns = [
    /(\w+)\s+is\s+(?:defined\s+as\s+)?(?:the\s+)?process\s+of\s+([^,.]+)/i,
    /(\w+)\s+is\s+(?:defined\s+as\s+)?(?:a\s+)?([^,.]+)/i,
    /(\w+)\s+refers\s+to\s+([^,.]+)/i,
    /(\w+)\s+means\s+([^,.]+)/i,
    /The\s+(\w+)\s+is\s+(?:the\s+)?([^,.]+)/i,
  ];

  content.sentences.forEach((sentence) => {
    for (const pattern of definitionPatterns) {
      const match = sentence.match(pattern);
      if (match) {
        const term = match[1].trim();
        const definition = match[2].trim();

        if (term.length < 3 || isCommonWord(term)) continue;

        const options = generateOptions(definition, content, term);

        questions.push({
          question: `What is ${term}?`,
          options,
          correctAnswer: 0,
          questionType: "definition",
          explanation: `According to the text: "${sentence}"`,
        });
        break;
      }
    }
  });

  return questions;
};

const generateFillBlankQuestions = (
  content: ExtractedContent,
): Omit<Question, "id" | "quizId">[] => {
  const questions: Omit<Question, "id" | "quizId">[] = [];

  content.sentences.forEach((sentence) => {
    const importantWords = extractImportantWords(sentence, content.keywords);

    if (importantWords.length > 0) {
      const wordToBlank =
        importantWords[Math.floor(Math.random() * importantWords.length)];

      const blankedSentence = sentence.replace(
        new RegExp(`\\b${wordToBlank}\\b`, "i"),
        "______",
      );

      if (blankedSentence === sentence) return;

      const distractors = content.keywords
        .filter((k) => k.toLowerCase() !== wordToBlank.toLowerCase())
        .slice(0, 3);

      if (!distractors || distractors.length < 3) return;

      const options = [wordToBlank, ...distractors];

      questions.push({
        question: `Fill in the blank: ${blankedSentence}`,
        options: shuffleArray(options),
        correctAnswer: 0,
        questionType: "fill-blank",
        explanation: `The correct answer is "${wordToBlank}". The complete sentence is: "${sentence}"`,
      });
    }
  });

  return questions;
};

const generateKeywordQuestions = (
  content: ExtractedContent,
): Omit<Question, "id" | "quizId">[] => {
  const questions: Omit<Question, "id" | "quizId">[] = [];

  content.headings.forEach((heading) => {
    const topicWords = heading.split(/\s+/).filter((w) => w.length > 3);
    if (topicWords.length === 0) return;

    const mainTopic = topicWords[0];

    const relatedSentences = content.sentences.filter((s) =>
      s.toLowerCase().includes(mainTopic.toLowerCase()),
    );

    if (relatedSentences.length > 0) {
      const sentence = relatedSentences[0];
      const keywords = extractImportantWords(sentence, content.keywords);

      if (keywords.length >= 4) {
        const correctKeyword =
          keywords.find((k) =>
            sentence.toLowerCase().includes(k.toLowerCase()),
          ) || keywords[0];

        const otherKeywords = keywords
          .filter((k) => k !== correctKeyword)
          .slice(0, 3);

        if (!otherKeywords || otherKeywords.length === 0) return;

        questions.push({
          question: `According to the text about "${heading}", which of the following is mentioned?`,
          options: shuffleArray([correctKeyword, ...otherKeywords]),
          correctAnswer: 0,
          questionType: "keyword",
          explanation: `The text states: "${sentence}"`,
        });
      }
    }
  });

  return questions;
};

const generateMultipleChoiceQuestions = (
  content: ExtractedContent,
): Omit<Question, "id" | "quizId">[] => {
  const questions: Omit<Question, "id" | "quizId">[] = [];

  const topicSentences: Record<string, string[]> = {};

  content.sentences.forEach((sentence) => {
    content.keywords.forEach((keyword) => {
      if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
        if (!topicSentences[keyword]) {
          topicSentences[keyword] = [];
        }
        topicSentences[keyword].push(sentence);
      }
    });
  });

  Object.entries(topicSentences).forEach(([topic, sentences]) => {
    if (sentences.length >= 2) {
      const sentence = sentences[0];
      const words = sentence.split(/\s+/).filter((w) => w.length > 4);

      if (words.length >= 5) {
        const questionWord =
          words.find((w) => content.keywords.includes(w.toLowerCase())) ||
          words[0];

        const allKeywords = content.keywords.filter(
          (k) => k !== questionWord.toLowerCase(),
        );
        const distractors = shuffleArray(allKeywords);
        const slicedDistractors = Array.isArray(distractors)
          ? distractors.slice(0, 3)
          : [];

        if (!slicedDistractors || slicedDistractors.length !== 3) return;

        questions.push({
          question: `Which of the following best relates to "${topic}"?`,
          options: shuffleArray([
            questionWord,
            ...slicedDistractors,
          ]) as string[],
          correctAnswer: 0,
          questionType: "multiple-choice",
          explanation: `Context from the text: "${sentence}"`,
        });
      }
    }
  });

  return questions;
};

const extractImportantWords = (
  sentence: string,
  keywords: string[],
): string[] => {
  const words = sentence.match(/\b[a-zA-Z]{4,}\b/g) || [];
  return words.filter(
    (word) =>
      keywords.includes(word.toLowerCase()) ||
      (word[0] === word[0].toUpperCase() && word.length > 4),
  );
};

const generateOptions = (
  correctAnswer: string,
  content: ExtractedContent,
  excludeTerm: string,
): string[] => {
  const distractors: string[] = [];

  content.keywords
    .filter((k) => k.toLowerCase() !== excludeTerm.toLowerCase())
    .forEach((k) => distractors.push(k));

  content.sentences.forEach((s) => {
    const phrases = s.match(/\b[a-zA-Z\s]{10,30}\b/g) || [];
    phrases.forEach((p) => {
      if (p.toLowerCase() !== correctAnswer.toLowerCase()) {
        distractors.push(p);
      }
    });
  });

  const shuffledDistractorsArray = shuffleArray(distractors);
  const shuffledDistractors = Array.isArray(shuffledDistractorsArray)
    ? shuffledDistractorsArray.slice(0, 3)
    : [];

  return shuffleArray([correctAnswer, ...shuffledDistractors]);
};

const isCommonWord = (word: string): boolean => {
  const commonWords = [
    "this",
    "that",
    "these",
    "those",
    "there",
    "their",
    "they",
    "what",
    "when",
    "where",
    "which",
    "while",
    "with",
    "within",
    "about",
    "above",
    "after",
    "again",
    "against",
    "all",
    "and",
    "any",
    "are",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "below",
    "between",
    "both",
    "but",
    "by",
    "can",
    "did",
    "do",
    "does",
    "doing",
    "don",
    "down",
    "during",
    "each",
    "few",
    "for",
    "from",
    "further",
    "had",
    "has",
    "have",
    "having",
    "he",
    "her",
    "here",
    "hers",
    "herself",
    "him",
    "himself",
    "his",
    "how",
    "into",
    "its",
    "itself",
    "just",
    "me",
    "more",
    "most",
    "my",
    "myself",
    "no",
    "nor",
    "not",
    "now",
    "off",
    "once",
    "only",
    "or",
    "other",
    "our",
    "ours",
    "ourselves",
    "out",
    "over",
    "own",
    "same",
    "she",
    "should",
    "so",
    "some",
    "such",
    "than",
    "the",
    "then",
    "too",
    "under",
    "until",
    "up",
    "very",
    "was",
    "we",
    "were",
    "will",
    "would",
    "you",
    "your",
    "yours",
    "yourself",
  ];
  return commonWords.includes(word.toLowerCase());
};

const shuffleArray = <T>(array: T[] | string): T[] => {
  console.log(
    "DEBUG shuffleArray input:",
    typeof array,
    Array.isArray(array),
    array,
  );
  // Guard against non-array inputs (e.g., JSON strings)
  if (!Array.isArray(array)) {
    try {
      const parsed = JSON.parse(array as string);
      if (!Array.isArray(parsed)) return [];
      array = parsed;
    } catch {
      return [];
    }
  }

  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getQuizTitle = (quizType: QuizType): string => {
  const titles: Record<QuizType, string> = {
    quiz: "Quick Quiz",
    "mock-exam": "Mock Exam",
    "full-exam": "Full Exam",
    "lesson-review": "Lesson Review",
  };
  return titles[quizType];
};

export const getRecommendedQuestionCount = (quizType: QuizType): number => {
  const counts: Record<QuizType, number> = {
    quiz: 10,
    "mock-exam": 25,
    "full-exam": 50,
    "lesson-review": 15,
  };
  return counts[quizType];
};
