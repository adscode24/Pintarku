export interface MathProblem {
  id: string;
  type: 'addition' | 'subtraction';
  num1: number;
  num2: number;
  emoji: string;
  objectName: string;
  storyPrompt?: string;
}

export const MATH_OBJECTS = [
  { emoji: '🍎', name: 'apel' },
  { emoji: '⭐', name: 'bintang' },
  { emoji: '🦆', name: 'bebek' },
  { emoji: '🍭', name: 'permen' },
  { emoji: '🚗', name: 'mobil' },
  { emoji: '🥕', name: 'wortel' },
  { emoji: '🎈', name: 'balon' },
  { emoji: '🐱', name: 'kucing' },
];

export function generateMathProblem(type: 'addition' | 'subtraction', difficulty: 'easy' | 'medium' | 'hard'): MathProblem {
  const obj = MATH_OBJECTS[Math.floor(Math.random() * MATH_OBJECTS.length)];
  let num1 = 1;
  let num2 = 1;

  if (difficulty === 'easy') {
    if (type === 'addition') {
      num1 = Math.floor(Math.random() * 5) + 1; // 1 - 5
      num2 = Math.floor(Math.random() * 5) + 1; // 1 - 5
    } else {
      num1 = Math.floor(Math.random() * 6) + 4; // 4 - 9
      num2 = Math.floor(Math.random() * (num1 - 1)) + 1; // 1 - (num1 - 1)
    }
  } else if (difficulty === 'medium') {
    if (type === 'addition') {
      num1 = Math.floor(Math.random() * 15) + 6; // 6 - 20
      num2 = Math.floor(Math.random() * 10) + 3; // 3 - 12
    } else {
      num1 = Math.floor(Math.random() * 15) + 12; // 12 - 26
      num2 = Math.floor(Math.random() * (num1 - 4)) + 3;
    }
  } else {
    // Hard (tens / puluhan up to 100)
    if (type === 'addition') {
      num1 = Math.floor(Math.random() * 40) + 20; // 20 - 59
      num2 = Math.floor(Math.random() * 35) + 10; // 10 - 44
    } else {
      num1 = Math.floor(Math.random() * 50) + 45; // 45 - 94
      num2 = Math.floor(Math.random() * 35) + 10; // 10 - 44
    }
  }

  const storyPrompt = type === 'addition'
    ? `Budi memiliki ${num1} ${obj.name}, lalu Ayah memberi ${num2} ${obj.name} lagi. Berapa jumlah semua ${obj.name} Budi sekarang?`
    : `Ada ${num1} ${obj.name} di atas meja. Siti mengambil ${num2} ${obj.name}. Berapa sisa ${obj.name} di atas meja?`;

  return {
    id: `math_${Date.now()}_${Math.random()}`,
    type,
    num1,
    num2,
    emoji: obj.emoji,
    objectName: obj.name,
    storyPrompt,
  };
}
