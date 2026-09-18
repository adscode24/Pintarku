import React, { useState, useEffect } from 'react';
import { DifficultyLevel, QuizLevel, QuizQuestion, UserProfile } from '../types';
import { getQuizLevel } from '../data/quizGenerator';
import { playSound, speakIndonesian } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Star, 
  Lock, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Trophy, 
  ChevronRight,
  BookOpen,
  ArrowLeft,
  Search,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

interface QuizModuleProps {
  userProfile: UserProfile;
  onCompleteLevel: (levelNum: number, score: number, stars: number, correctCount: number) => void;
  onUpdateDifficulty?: (difficulty: DifficultyLevel) => void;
}

export default function QuizModule({ userProfile, onCompleteLevel, onUpdateDifficulty }: QuizModuleProps) {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(userProfile.difficulty || 'mudah');
  const [selectedLevelNum, setSelectedLevelNum] = useState<number | null>(null);
  const [currentLevelData, setCurrentLevelData] = useState<QuizLevel | null>(null);

  // Sync difficulty if userProfile changes
  useEffect(() => {
    if (userProfile.difficulty && userProfile.difficulty !== difficulty) {
      setDifficulty(userProfile.difficulty);
    }
  }, [userProfile.difficulty]);

  // Active Quiz State (10 questions)
  const [questionIdx, setQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isAnswerSelected, setIsAnswerSelected] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Level selector pagination / stage
  const [stageIndex, setStageIndex] = useState<number>(0); // 0 = 1-20, 1 = 21-40, etc.
  const [searchLevel, setSearchLevel] = useState<string>('');

  const TOTAL_LEVELS = 200;
  const LEVELS_PER_STAGE = 20;
  const TOTAL_STAGES = Math.ceil(TOTAL_LEVELS / LEVELS_PER_STAGE); // 10 stages

  const startLevel = (levelNum: number, targetDiff: DifficultyLevel = difficulty) => {
    if (levelNum > userProfile.highestLevelUnlocked) {
      playSound('wrong');
      return;
    }
    playSound('pop');
    const data = getQuizLevel(levelNum, targetDiff);
    setCurrentLevelData(data);
    setSelectedLevelNum(levelNum);
    setQuestionIdx(0);
    setUserAnswers({});
    setIsAnswerSelected(false);
    setQuizFinished(false);
  };

  const handleDifficultyChange = (newDiff: DifficultyLevel) => {
    playSound('click');
    setDifficulty(newDiff);
    if (onUpdateDifficulty) {
      onUpdateDifficulty(newDiff);
    }
    const diffText = newDiff === 'mudah' ? 'Mudah: angka 1 sampai 10' : newDiff === 'sedang' ? 'Sedang: angka 1 sampai 25' : 'Sulit: angka sampai 100';
    speakIndonesian(`Tingkat kesulitan diubah ke ${newDiff}. ${diffText}.`);

    if (selectedLevelNum !== null) {
      // Refresh current quiz with new difficulty
      const data = getQuizLevel(selectedLevelNum, newDiff);
      setCurrentLevelData(data);
      setQuestionIdx(0);
      setUserAnswers({});
      setIsAnswerSelected(false);
      setQuizFinished(false);
    }
  };

  const handleSelectOption = (opt: string) => {
    if (isAnswerSelected || !currentLevelData) return;
    const currentQ = currentLevelData.questions[questionIdx];
    const isCorrect = opt === currentQ.correctAnswer;

    setUserAnswers(prev => ({ ...prev, [questionIdx]: opt }));
    setIsAnswerSelected(true);

    if (isCorrect) {
      playSound('correct');
      speakIndonesian('Benar!');
    } else {
      playSound('wrong');
      speakIndonesian('Kurang tepat.');
    }
  };

  const handleNextQuestion = () => {
    if (!currentLevelData) return;
    playSound('click');

    if (questionIdx < currentLevelData.questions.length - 1) {
      setQuestionIdx(questionIdx + 1);
      setIsAnswerSelected(false);
    } else {
      // Calculate final score after 10 questions
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (!currentLevelData) return;
    let correct = 0;
    currentLevelData.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });

    const score = Math.round((correct / currentLevelData.questions.length) * 100);
    let stars = 0;
    if (score >= 90) stars = 3;
    else if (score >= 70) stars = 2;
    else if (score >= 50) stars = 1;

    setQuizFinished(true);

    if (stars > 0) {
      playSound('victory');
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
      });
      speakIndonesian(`Selamat! Kamu mendapatkan nilai ${score} dan ${stars} bintang!`);
    } else {
      playSound('wrong');
      speakIndonesian(`Nilaimu ${score}. Jangan menyerah, ayo coba lagi ya!`);
    }

    onCompleteLevel(currentLevelData.levelNumber, score, stars, correct);
  };

  const readQuestionAloud = () => {
    if (!currentLevelData) return;
    playSound('pop');
    const q = currentLevelData.questions[questionIdx];
    speakIndonesian(q.question);
  };

  /* -------------------------------------------------------------
     VIEW 1: ACTIVE QUIZ QUESTIONS (10 Soal per level)
  ------------------------------------------------------------- */
  if (selectedLevelNum !== null && currentLevelData && !quizFinished) {
    const q = currentLevelData.questions[questionIdx];
    const currentAns = userAnswers[questionIdx];

    return (
      <div id="active-quiz-view" className="flex flex-col gap-4 max-w-xl mx-auto pb-20">
        {/* Top bar with back button, level title & progress */}
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between">
          <button
            id="btn-quit-quiz"
            onClick={() => { setSelectedLevelNum(null); playSound('click'); }}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="font-fredoka font-bold text-slate-800 text-sm">
                Level {currentLevelData.levelNumber}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                difficulty === 'mudah' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                difficulty === 'sedang' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {difficulty}
              </span>
            </div>
            <span className="text-[11px] text-amber-600 font-semibold">
              Soal {questionIdx + 1} dari 10
            </span>
          </div>

          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="text-xs font-bold text-amber-800">
              {Object.values(userAnswers).filter((ans, idx) => ans === currentLevelData.questions[idx]?.correctAnswer).length} Benar
            </span>
          </div>
        </div>

        {/* 10 Question Progress Dots Bar */}
        <div className="flex items-center gap-1.5 px-2">
          {currentLevelData.questions.map((_, idx) => {
            let dotColor = 'bg-slate-200';
            if (idx === questionIdx) dotColor = 'bg-amber-500 ring-2 ring-amber-300 scale-110';
            else if (idx < questionIdx) {
              const isCor = userAnswers[idx] === currentLevelData.questions[idx].correctAnswer;
              dotColor = isCor ? 'bg-emerald-500' : 'bg-rose-500';
            }
            return (
              <div
                key={idx}
                className={`h-2.5 flex-1 rounded-full transition-all ${dotColor}`}
              />
            );
          })}
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-amber-200/80 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-100 uppercase tracking-wider">
              {q.category}
            </span>

            <button
              id="btn-read-question"
              onClick={readQuestionAloud}
              className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl flex items-center gap-1 font-bold text-xs shadow-xs active:scale-95"
              title="Dengarkan Soal (Suara Guru)"
            >
              <Volume2 className="w-4 h-4" />
              <span>Bacakan</span>
            </button>
          </div>

          <div className="flex flex-col items-center text-center gap-2 py-2">
            {q.visualEmoji && (
              <div className="text-5xl p-3 bg-amber-50 rounded-2xl shadow-inner border border-amber-100">
                {q.visualEmoji}
              </div>
            )}
            <h3 className="font-fredoka font-bold text-slate-800 text-xl leading-snug">
              {q.question}
            </h3>
            {q.subText && (
              <p className="text-sm font-semibold text-slate-500">
                {q.subText}
              </p>
            )}
          </div>

          {/* 4 Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {q.options.map((opt, oIdx) => {
              const isSelected = currentAns === opt;
              const isCorrectOpt = opt === q.correctAnswer;

              let btnStyle = 'bg-slate-50 hover:bg-amber-50/80 border-slate-200 text-slate-800';
              if (isAnswerSelected) {
                if (isCorrectOpt) {
                  btnStyle = 'bg-emerald-500 border-emerald-600 text-white font-bold ring-2 ring-emerald-300';
                } else if (isSelected && !isCorrectOpt) {
                  btnStyle = 'bg-rose-500 border-rose-600 text-white font-bold';
                } else {
                  btnStyle = 'bg-slate-100 text-slate-400 border-slate-200 opacity-60';
                }
              }

              const letters = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={oIdx}
                  id={`opt-${oIdx}`}
                  onClick={() => handleSelectOption(opt)}
                  disabled={isAnswerSelected}
                  className={`p-3.5 rounded-2xl font-fredoka font-bold text-base border-2 shadow-xs transition-all active:scale-98 flex items-center justify-between text-left ${btnStyle}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-white/30 border border-current/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {letters[oIdx]}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isAnswerSelected && isCorrectOpt && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                  {isAnswerSelected && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation banner & Next button */}
          {isAnswerSelected && (
            <div className="flex flex-col gap-3 pt-2 border-t border-slate-100 animate-soft-bounce">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
                💡 <span className="font-bold">Penjelasan:</span> {q.explanation}
              </div>

              <button
                id="btn-next-quiz-q"
                onClick={handleNextQuestion}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-fredoka font-bold text-base rounded-2xl shadow-md active:scale-98 flex items-center justify-center gap-2"
              >
                <span>{questionIdx < 9 ? 'Soal Berikutnya' : 'Lihat Hasil Nilai'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
     VIEW 2: RESULT SCREEN (Setelah 10 soal dikerjakan)
  ------------------------------------------------------------- */
  if (selectedLevelNum !== null && currentLevelData && quizFinished) {
    let correctCount = 0;
    currentLevelData.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) correctCount++;
    });
    const score = Math.round((correctCount / 10) * 100);
    const starsEarned = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
    const isPassed = score >= 60;

    return (
      <div id="quiz-result-view" className="flex flex-col gap-4 max-w-xl mx-auto pb-20">
        <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-amber-300 text-center flex flex-col items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-3xl border border-amber-200">
            <Trophy className="w-16 h-16 text-amber-500 animate-bounce" />
          </div>

          <div>
            <h2 className="text-2xl font-fredoka font-bold text-slate-800">
              Hasil Level {currentLevelData.levelNumber}
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              {currentLevelData.theme}
            </p>
          </div>

          {/* Big Score Card */}
          <div className="py-2 flex flex-col items-center gap-2">
            <div className="text-5xl font-fredoka font-bold text-indigo-700 bg-indigo-50 px-6 py-2 rounded-3xl border-2 border-indigo-200">
              {score}
              <span className="text-2xl text-slate-400">/100</span>
            </div>

            {/* Stars display */}
            <div className="flex items-center gap-2 py-1">
              {[1, 2, 3].map((starIdx) => (
                <Star
                  key={starIdx}
                  className={`w-9 h-9 transition-transform ${
                    starIdx <= starsEarned
                      ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-md'
                      : 'text-slate-200 fill-slate-100'
                  }`}
                />
              ))}
            </div>

            <p className="font-fredoka font-bold text-base text-slate-700">
              {score === 100
                ? '🌟 Sempurna! Kamu Jenius Sekali!'
                : score >= 80
                ? '🎉 Hebat Banget! Terus Berprestasi!'
                : isPassed
                ? '👍 Bagus! Kamu Berhasil Lulus!'
                : '💪 Jangan Menyerah, Ayo Coba Lagi!'}
            </p>
            <p className="text-xs text-slate-500">
              {correctCount} dari 10 soal dijawab dengan benar.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-2">
            <button
              id="btn-retry-level"
              onClick={() => startLevel(currentLevelData.levelNumber)}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-fredoka font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi Level</span>
            </button>

            {isPassed && currentLevelData.levelNumber < TOTAL_LEVELS && (
              <button
                id="btn-next-level"
                onClick={() => startLevel(currentLevelData.levelNumber + 1)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-fredoka font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Level Selanjutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              id="btn-back-map"
              onClick={() => setSelectedLevelNum(null)}
              className="py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-fredoka font-bold rounded-2xl shadow-md active:scale-95"
            >
              Peta 200 Level
            </button>
          </div>

          {/* Review of all 10 questions */}
          <div className="w-full text-left pt-4 border-t border-slate-100 flex flex-col gap-2">
            <h4 className="font-fredoka font-bold text-slate-700 text-sm">
              Pembahasan 10 Soal:
            </h4>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {currentLevelData.questions.map((item, idx) => {
                const userAns = userAnswers[idx];
                const isCor = userAns === item.correctAnswer;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 ${
                      isCor ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-800">
                        Soal {idx + 1}: {item.question}
                      </span>
                      {isCor ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Benar
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Salah
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600">
                      Jawabanmu: <span className="font-bold">{userAns || '-'}</span> | Kunci: <span className="font-bold text-emerald-700">{item.correctAnswer}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      💡 {item.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
     VIEW 3: 200 LEVELS ROADMAP SELECTOR
  ------------------------------------------------------------- */
  const startLevelNum = stageIndex * LEVELS_PER_STAGE + 1;
  const endLevelNum = Math.min(TOTAL_LEVELS, (stageIndex + 1) * LEVELS_PER_STAGE);
  const currentStageLevels = Array.from(
    { length: endLevelNum - startLevelNum + 1 },
    (_, i) => startLevelNum + i
  );

  return (
    <div id="quiz-map-view" className="flex flex-col gap-4 max-w-xl mx-auto pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-4 sm:p-5 text-white shadow-md flex items-center justify-between">
        <div>
          <span className="px-2.5 py-0.5 bg-white/20 rounded-lg text-xs font-bold tracking-wider uppercase">
            Tantangan Juara
          </span>
          <h2 className="text-2xl font-fredoka font-bold mt-1">
            200 Level Kuis Cerdas
          </h2>
          <p className="text-xs text-indigo-100">
            Setiap level berisi 10 soal membaca, menulis & matematika.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 bg-white/10 p-2.5 rounded-2xl backdrop-blur-xs border border-white/20">
          <span className="text-xs font-bold text-amber-300">Level Tertinggi</span>
          <span className="text-2xl font-fredoka font-bold">
            {userProfile.highestLevelUnlocked} / 200
          </span>
        </div>
      </div>

      {/* Difficulty Level Selector Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-fredoka font-bold text-slate-800 text-sm">
            <SlidersHorizontal className="w-4 h-4 text-amber-500" />
            <span>Tingkat Kesulitan Kuis:</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {difficulty === 'mudah' && '🟢 Mudah: Angka 1 - 10 & Kata 2 suku kata (APEL, BOLA, BUKU)'}
            {difficulty === 'sedang' && '🟡 Sedang: Angka 1 - 25 & Kata 2-3 suku kata (SEKOLAH, KELINCI)'}
            {difficulty === 'sulit' && '🔴 Sulit: Angka 1 - 100 & Kata 3-4 suku kata (PERPUSTAKAAN, KEBERSIHAN)'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
          <button
            id="btn-diff-mudah"
            onClick={() => handleDifficultyChange('mudah')}
            className={`py-2 px-3 rounded-xl font-fredoka font-bold text-xs transition-all flex items-center justify-center gap-1 ${
              difficulty === 'mudah'
                ? 'bg-emerald-500 text-white shadow-sm scale-102 ring-2 ring-emerald-300'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            🟢 Mudah
          </button>
          <button
            id="btn-diff-sedang"
            onClick={() => handleDifficultyChange('sedang')}
            className={`py-2 px-3 rounded-xl font-fredoka font-bold text-xs transition-all flex items-center justify-center gap-1 ${
              difficulty === 'sedang'
                ? 'bg-amber-500 text-white shadow-sm scale-102 ring-2 ring-amber-300'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            🟡 Sedang
          </button>
          <button
            id="btn-diff-sulit"
            onClick={() => handleDifficultyChange('sulit')}
            className={`py-2 px-3 rounded-xl font-fredoka font-bold text-xs transition-all flex items-center justify-center gap-1 ${
              difficulty === 'sulit'
                ? 'bg-rose-500 text-white shadow-sm scale-102 ring-2 ring-rose-300'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            🔴 Sulit
          </button>
        </div>
      </div>

      {/* Stage / Chapter Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {Array.from({ length: TOTAL_STAGES }).map((_, sIdx) => {
          const sStart = sIdx * LEVELS_PER_STAGE + 1;
          const sEnd = (sIdx + 1) * LEVELS_PER_STAGE;
          const isSelected = stageIndex === sIdx;
          const isUnlocked = userProfile.highestLevelUnlocked >= sStart;

          return (
            <button
              key={sIdx}
              id={`stage-btn-${sIdx}`}
              onClick={() => { setStageIndex(sIdx); playSound('click'); }}
              className={`flex-shrink-0 py-2 px-3 rounded-xl font-fredoka font-bold text-xs transition-all flex items-center gap-1 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm scale-105'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50'
              }`}
            >
              <span>Lvl {sStart}-{sEnd}</span>
              {!isUnlocked && <Lock className="w-3 h-3 text-slate-400" />}
            </button>
          );
        })}
      </div>

      {/* Grid of 20 levels in the current stage */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-fredoka font-bold text-slate-800 text-sm">
            Tingkatan Level {startLevelNum} sampai {endLevelNum}:
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            Sentuh level yang terbuka untuk mulai
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
          {currentStageLevels.map((lvl) => {
            const isUnlocked = lvl <= userProfile.highestLevelUnlocked;
            const record = userProfile.levelScores[lvl];
            const stars = record ? record.stars : 0;

            return (
              <button
                key={lvl}
                id={`level-card-${lvl}`}
                onClick={() => startLevel(lvl)}
                disabled={!isUnlocked}
                className={`relative aspect-square rounded-2xl p-2 flex flex-col items-center justify-between transition-all active:scale-95 ${
                  isUnlocked
                    ? lvl === userProfile.highestLevelUnlocked
                      ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-md ring-3 ring-amber-300 scale-105'
                      : 'bg-gradient-to-b from-indigo-50 to-indigo-100/80 border-2 border-indigo-200 text-indigo-950 hover:shadow-sm'
                    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {/* Level number */}
                <span className="font-fredoka font-bold text-base leading-none">
                  {lvl}
                </span>

                {/* Stars or Lock Icon */}
                {isUnlocked ? (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= stars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 fill-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                ) : (
                  <Lock className="w-4 h-4 text-slate-400 mb-1" />
                )}

                {/* Score badge if completed */}
                {record && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-white/80 px-1 rounded-sm leading-none">
                    {record.score}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
