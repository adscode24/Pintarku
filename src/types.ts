export type TabType = 'home' | 'writing' | 'reading' | 'math' | 'quiz' | 'istirahat' | 'badges';

export type GameCharacter = 'burung' | 'dino' | 'kucing' | 'unicorn';

export type DifficultyLevel = 'mudah' | 'sedang' | 'sulit';

export interface CharacterOption {
  id: GameCharacter;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export interface UserAccountSummary {
  id: string;
  name: string;
  avatar: string;
  age: number;
  grade: string;
  difficulty: DifficultyLevel;
  totalStars: number;
  hasPin: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  age: number;
  grade: string;
  difficulty: DifficultyLevel;
  pin?: string;
  totalStars: number;
  totalCoins: number;
  highestLevelUnlocked: number;
  levelScores: Record<number, { score: number; stars: number; completedAt: string }>;
  unlockedBadges: string[];
  stats: {
    writingPracticed: number;
    wordsRead: number;
    mathSolved: number;
    quizCompleted: number;
    perfectQuizzes: number;
    correctAnswersCount: number;
  };
}

export interface WritingItem {
  id: string;
  type: 'letter_upper' | 'letter_lower' | 'number' | 'word';
  char: string;
  title: string;
  pronounceWord?: string;
  phonics: string;
  category?: string;
  exampleImage?: string;
  strokeHint?: string;
}

export interface ReadingItem {
  id: string;
  type: 'letter' | 'syllables' | 'word' | 'sentence';
  display: string;
  syllables?: string[];
  meaning?: string;
  emoji: string;
  audioText: string;
  category?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  subText?: string;
  category: 'membaca' | 'menulis' | 'matematika' | 'pengetahuan';
  visualEmoji?: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizLevel {
  levelNumber: number;
  title: string;
  ageGroup: '6-7 thn (Kls 1)' | '7-8 thn (Kls 2)' | '8-9 thn (Kls 3)' | '9-10 thn (Kls 4)';
  theme: string;
  questions: QuizQuestion[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  targetCount: number;
  currentCount?: number;
  unlocked: boolean;
  unlockedAt?: string;
}
