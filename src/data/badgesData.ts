import { Badge, UserProfile } from '../types';

export const ALL_BADGES: Omit<Badge, 'unlocked' | 'unlockedAt' | 'currentCount'>[] = [
  {
    id: 'first_quiz',
    title: 'Langkah Pertama',
    description: 'Selesaikan kuis pertamamu dengan baik!',
    icon: '🌟',
    color: 'from-amber-400 to-yellow-500',
    targetCount: 1,
  },
  {
    id: 'writer_5',
    title: 'Jago Nulis',
    description: 'Latihan menulis 5 huruf, angka, atau kata.',
    icon: '✍️',
    color: 'from-blue-400 to-indigo-500',
    targetCount: 5,
  },
  {
    id: 'reader_10',
    title: 'Pakar Membaca',
    description: 'Dengarkan suara membaca 10 kata atau kalimat.',
    icon: '📖',
    color: 'from-emerald-400 to-teal-500',
    targetCount: 10,
  },
  {
    id: 'math_genius',
    title: 'Ahli Hitung',
    description: 'Selesaikan 5 soal latihan matematika dengan benar.',
    icon: '🧮',
    color: 'from-purple-400 to-pink-500',
    targetCount: 5,
  },
  {
    id: 'perfect_100',
    title: 'Nilai 100 Sempurna',
    description: 'Dapatkan nilai 100 (3 bintang penuh) di salah satu level kuis.',
    icon: '💯',
    color: 'from-rose-400 to-red-500',
    targetCount: 1,
  },
  {
    id: 'star_25',
    title: 'Kolektor 25 Bintang',
    description: 'Kumpulkan total 25 bintang prestasi.',
    icon: '⭐',
    color: 'from-amber-400 to-orange-500',
    targetCount: 25,
  },
  {
    id: 'star_75',
    title: 'Bintang Bersinar',
    description: 'Kumpulkan total 75 bintang prestasi.',
    icon: '✨',
    color: 'from-yellow-400 to-amber-500',
    targetCount: 75,
  },
  {
    id: 'level_10',
    title: 'Penjelajah Level 10',
    description: 'Selesaikan kuis sampai Level 10.',
    icon: '🚀',
    color: 'from-cyan-400 to-blue-600',
    targetCount: 10,
  },
  {
    id: 'level_50',
    title: 'Juara Kelas Level 50',
    description: 'Berhasil menuntaskan kuis sampai Level 50!',
    icon: '🏆',
    color: 'from-amber-500 to-yellow-600',
    targetCount: 50,
  },
  {
    id: 'level_100',
    title: 'Master Edukasi Level 100',
    description: 'Pencapaian luar biasa mencapai Level 100!',
    icon: '👑',
    color: 'from-violet-500 to-purple-700',
    targetCount: 100,
  },
  {
    id: 'level_200',
    title: 'Legenda Puncak 200 Level',
    description: 'Tuntaskan seluruh 200 level kuis pembelajaran!',
    icon: '🪐',
    color: 'from-fuchsia-500 to-pink-600',
    targetCount: 200,
  },
];

export function checkNewBadges(profile: UserProfile): { updatedUnlocked: string[]; newlyEarned: Badge[] } {
  const currentUnlocked = new Set(profile.unlockedBadges);
  const newlyEarned: Badge[] = [];

  ALL_BADGES.forEach(b => {
    if (currentUnlocked.has(b.id)) return;

    let progress = 0;
    if (b.id === 'first_quiz') progress = profile.stats.quizCompleted;
    else if (b.id === 'writer_5') progress = profile.stats.writingPracticed;
    else if (b.id === 'reader_10') progress = profile.stats.wordsRead;
    else if (b.id === 'math_genius') progress = profile.stats.mathSolved;
    else if (b.id === 'perfect_100') progress = profile.stats.perfectQuizzes;
    else if (b.id === 'star_25') progress = profile.totalStars;
    else if (b.id === 'star_75') progress = profile.totalStars;
    else if (b.id === 'level_10') progress = profile.highestLevelUnlocked;
    else if (b.id === 'level_50') progress = profile.highestLevelUnlocked;
    else if (b.id === 'level_100') progress = profile.highestLevelUnlocked;
    else if (b.id === 'level_200') progress = profile.highestLevelUnlocked;

    if (progress >= b.targetCount) {
      currentUnlocked.add(b.id);
      newlyEarned.push({
        ...b,
        unlocked: true,
        currentCount: progress,
        unlockedAt: new Date().toISOString(),
      });
    }
  });

  return {
    updatedUnlocked: Array.from(currentUnlocked),
    newlyEarned,
  };
}
