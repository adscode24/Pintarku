import React from 'react';
import { ALL_BADGES } from '../data/badgesData';
import { UserProfile, Badge } from '../types';
import { playSound } from '../utils/audio';
import { X, Trophy, Star, Award, CheckCircle2, Lock } from 'lucide-react';

interface BadgesModalProps {
  userProfile: UserProfile;
  onClose: () => void;
}

export default function BadgesModal({ userProfile, onClose }: BadgesModalProps) {
  const unlockedSet = new Set(userProfile.unlockedBadges);

  const getProgressForBadge = (badgeId: string): { current: number; target: number } => {
    const badge = ALL_BADGES.find(b => b.id === badgeId);
    const target = badge ? badge.targetCount : 1;
    let current = 0;

    if (badgeId === 'first_quiz') current = userProfile.stats.quizCompleted;
    else if (badgeId === 'writer_5') current = userProfile.stats.writingPracticed;
    else if (badgeId === 'reader_10') current = userProfile.stats.wordsRead;
    else if (badgeId === 'math_genius') current = userProfile.stats.mathSolved;
    else if (badgeId === 'perfect_100') current = userProfile.stats.perfectQuizzes;
    else if (badgeId === 'star_25') current = userProfile.totalStars;
    else if (badgeId === 'star_75') current = userProfile.totalStars;
    else if (badgeId === 'level_10') current = userProfile.highestLevelUnlocked;
    else if (badgeId === 'level_50') current = userProfile.highestLevelUnlocked;
    else if (badgeId === 'level_100') current = userProfile.highestLevelUnlocked;
    else if (badgeId === 'level_200') current = userProfile.highestLevelUnlocked;

    return { current: Math.min(current, target), target };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border-4 border-amber-300 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-2xl">
              <Trophy className="w-6 h-6 text-yellow-100" />
            </div>
            <div>
              <h3 className="font-fredoka font-bold text-xl leading-tight">
                Galeri Lencana Prestasi
              </h3>
              <p className="text-xs text-amber-100">
                {userProfile.unlockedBadges.length} dari {ALL_BADGES.length} lencana telah diraih
              </p>
            </div>
          </div>

          <button
            onClick={() => { onClose(); playSound('click'); }}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stars summary banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Total Koleksi: {userProfile.totalStars} Bintang Emas</span>
          </div>
          <span className="text-slate-500">
            Terus belajar untuk membuka semua lencana!
          </span>
        </div>

        {/* Badges List */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3">
          {ALL_BADGES.map((b) => {
            const isUnlocked = unlockedSet.has(b.id);
            const { current, target } = getProgressForBadge(b.id);
            const percent = Math.min(100, Math.round((current / target) * 100));

            return (
              <div
                key={b.id}
                className={`p-3.5 rounded-2xl border-2 flex items-center gap-3.5 transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-r from-amber-50/70 to-orange-50/70 border-amber-300 shadow-xs'
                    : 'bg-slate-50/80 border-slate-200 opacity-80'
                }`}
              >
                {/* Badge Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm flex-shrink-0 relative ${
                    isUnlocked
                      ? `bg-gradient-to-br ${b.color} text-white ring-2 ring-amber-300`
                      : 'bg-slate-200 text-slate-400 grayscale'
                  }`}
                >
                  <span>{b.icon}</span>
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-slate-900/30 rounded-2xl flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white drop-shadow" />
                    </div>
                  )}
                </div>

                {/* Badge Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-fredoka font-bold text-slate-800 text-sm truncate">
                      {b.title}
                    </h4>
                    {isUnlocked ? (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Diraih
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">
                        {current} / {target}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                    {b.description}
                  </p>

                  {/* Progress bar for locked badge */}
                  {!isUnlocked && (
                    <div className="mt-2 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => { onClose(); playSound('click'); }}
            className="py-2 px-5 bg-amber-500 hover:bg-amber-600 text-white font-fredoka font-bold text-sm rounded-xl shadow-sm active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
