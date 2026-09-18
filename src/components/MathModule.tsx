import React, { useState, useEffect } from 'react';
import { generateMathProblem, MathProblem } from '../data/mathData';
import { playSound, speakIndonesian } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Plus, 
  Minus, 
  Volume2, 
  Sparkles, 
  HelpCircle, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Lightbulb
} from 'lucide-react';

interface MathModuleProps {
  onEarnStar: () => void;
  onRecordMath: () => void;
}

export default function MathModule({ onEarnStar, onRecordMath }: MathModuleProps) {
  const [opType, setOpType] = useState<'addition' | 'subtraction'>('addition');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [currentProblem, setCurrentProblem] = useState<MathProblem>(() => generateMathProblem('addition', 'easy'));
  
  // Interactive counters
  const [tappedGroup1, setTappedGroup1] = useState<number[]>([]);
  const [tappedGroup2, setTappedGroup2] = useState<number[]>([]);
  const [subtractedIndices, setSubtractedIndices] = useState<number[]>([]);

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const correctAnswer = opType === 'addition'
    ? currentProblem.num1 + currentProblem.num2
    : currentProblem.num1 - currentProblem.num2;

  // Generate 4 plausible answer options
  const [options, setOptions] = useState<number[]>([]);

  useEffect(() => {
    const opts = new Set<number>();
    opts.add(correctAnswer);

    let attempts = 0;
    while (opts.size < 4 && attempts < 40) {
      attempts++;
      const sign = (Math.random() > 0.5 && correctAnswer > 2) ? -1 : 1;
      const delta = (Math.floor(Math.random() * 4) + 1) * sign;
      const val = Math.max(0, correctAnswer + delta);
      opts.add(val);
    }

    // Deterministic fallback if set still has fewer than 4 unique numbers
    let fallbackOffset = 1;
    while (opts.size < 4) {
      opts.add(correctAnswer + fallbackOffset);
      fallbackOffset++;
    }

    const arr = Array.from(opts);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOptions(arr);

    // reset interactive state
    setTappedGroup1([]);
    setTappedGroup2([]);
    setSubtractedIndices([]);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowExplanation(false);
  }, [currentProblem, correctAnswer]);

  const loadNewProblem = (type = opType, diff = difficulty) => {
    playSound('pop');
    setCurrentProblem(generateMathProblem(type, diff));
  };

  const handleSelectAnswer = (ans: number) => {
    if (isAnswered) return;
    setSelectedAnswer(ans);
    setIsAnswered(true);

    if (ans === correctAnswer) {
      playSound('correct');
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
      onEarnStar();
      onRecordMath();
      speakIndonesian(`Bagus sekali! Jawabannya benar, ${correctAnswer}.`);
    } else {
      playSound('wrong');
      speakIndonesian(`Kurang tepat, coba hitung lagi ya.`);
    }
  };

  const handleVoiceExplain = () => {
    playSound('pop');
    const wordOp = opType === 'addition' ? 'ditambah' : 'dikurangi';
    const text = `${currentProblem.num1} ${wordOp} ${currentProblem.num2} sama dengan ${correctAnswer}.`;
    speakIndonesian(text);
  };

  const toggleCrossItem = (index: number) => {
    playSound('pop');
    if (subtractedIndices.includes(index)) {
      setSubtractedIndices(subtractedIndices.filter((i) => i !== index));
    } else {
      if (subtractedIndices.length < currentProblem.num2) {
        setSubtractedIndices([...subtractedIndices, index]);
      }
    }
  };

  return (
    <div id="math-module" className="flex flex-col gap-4 max-w-xl mx-auto pb-20">
      {/* Operation selector: Penjumlahan vs Pengurangan */}
      <div className="grid grid-cols-2 gap-2 bg-white/80 p-1.5 rounded-2xl shadow-sm border border-amber-100">
        <button
          id="op-addition"
          onClick={() => {
            setOpType('addition');
            loadNewProblem('addition', difficulty);
          }}
          className={`py-2.5 rounded-xl font-fredoka font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            opType === 'addition'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-blue-50'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Penjumlahan (+)</span>
        </button>
        <button
          id="op-subtraction"
          onClick={() => {
            setOpType('subtraction');
            loadNewProblem('subtraction', difficulty);
          }}
          className={`py-2.5 rounded-xl font-fredoka font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            opType === 'subtraction'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          <Minus className="w-4 h-4" />
          <span>Pengurangan (-)</span>
        </button>
      </div>

      {/* Difficulty Level Tabs */}
      <div className="flex items-center justify-between gap-1 bg-white/80 p-1 rounded-2xl border border-slate-100 text-xs">
        <button
          id="diff-easy"
          onClick={() => { setDifficulty('easy'); loadNewProblem(opType, 'easy'); }}
          className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
            difficulty === 'easy' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600'
          }`}
        >
          🌱 Tingkat 1 (1 - 10)
        </button>
        <button
          id="diff-medium"
          onClick={() => { setDifficulty('medium'); loadNewProblem(opType, 'medium'); }}
          className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
            difficulty === 'medium' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600'
          }`}
        >
          🌿 Tingkat 2 (10 - 30)
        </button>
        <button
          id="diff-hard"
          onClick={() => { setDifficulty('hard'); loadNewProblem(opType, 'hard'); }}
          className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
            difficulty === 'hard' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
          }`}
        >
          🌳 Tingkat 3 (Puluhan Susun)
        </button>
      </div>

      {/* Main Math Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-md border-2 border-amber-200/80 flex flex-col gap-4">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentProblem.emoji}</span>
            <div>
              <h3 className="font-fredoka font-bold text-slate-800 text-lg">
                {opType === 'addition' ? 'Bantu Budi Menjumlahkan' : 'Bantu Siti Mengurangkan'}
              </h3>
              <p className="text-xs text-slate-500">Hitung dengan cermat ya!</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-math-voice"
              onClick={handleVoiceExplain}
              className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl flex items-center gap-1 font-bold text-xs"
              title="Dengarkan Suara Guru"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Suara</span>
            </button>
            <button
              id="btn-math-new"
              onClick={() => loadNewProblem()}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              title="Soal Lain"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Story prompt if available */}
        {currentProblem.storyPrompt && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70 text-xs text-amber-900 leading-relaxed font-medium">
            "{currentProblem.storyPrompt}"
          </div>
        )}

        {/* Visual calculation display */}
        {difficulty !== 'hard' ? (
          /* Visual Equation with big numbers & interactive emoji objects */
          <div className="flex flex-col gap-3 items-center py-2">
            <div className="flex items-center justify-center gap-3 font-fredoka font-bold text-4xl text-slate-800">
              <span className="text-blue-600">{currentProblem.num1}</span>
              <span className="text-amber-500">{opType === 'addition' ? '+' : '-'}</span>
              <span className="text-purple-600">{currentProblem.num2}</span>
              <span className="text-slate-400">=</span>
              <span className="w-14 h-12 rounded-2xl bg-amber-100 border-2 border-dashed border-amber-400 flex items-center justify-center text-3xl text-amber-700">
                {isAnswered ? correctAnswer : '?'}
              </span>
            </div>

            {/* Visual Manipulatives (Only on easy / medium) */}
            {difficulty === 'easy' && (
              <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex flex-col gap-2">
                <p className="text-[11px] font-bold text-slate-500 text-center">
                  {opType === 'addition' 
                    ? 'Sentuh objek di bawah untuk membantumu menghitung:'
                    : `Sentuh ${currentProblem.num2} benda untuk mencoretnya (mengurangkan):`}
                </p>

                {opType === 'addition' ? (
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {/* Group 1 */}
                    <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50 rounded-xl border border-blue-200 max-w-[150px] justify-center">
                      {Array.from({ length: currentProblem.num1 }).map((_, idx) => (
                        <button
                          key={`g1_${idx}`}
                          onClick={() => {
                            playSound('pop');
                            setTappedGroup1(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
                          }}
                          className={`text-2xl transition-transform active:scale-90 ${tappedGroup1.includes(idx) ? 'scale-125 opacity-100' : 'opacity-85'}`}
                        >
                          {currentProblem.emoji}
                        </button>
                      ))}
                    </div>

                    <span className="text-2xl font-bold text-slate-400">+</span>

                    {/* Group 2 */}
                    <div className="flex flex-wrap gap-1.5 p-2 bg-purple-50 rounded-xl border border-purple-200 max-w-[150px] justify-center">
                      {Array.from({ length: currentProblem.num2 }).map((_, idx) => (
                        <button
                          key={`g2_${idx}`}
                          onClick={() => {
                            playSound('pop');
                            setTappedGroup2(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
                          }}
                          className={`text-2xl transition-transform active:scale-90 ${tappedGroup2.includes(idx) ? 'scale-125 opacity-100' : 'opacity-85'}`}
                        >
                          {currentProblem.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Subtraction Interactive Cross-out */
                  <div className="flex flex-wrap gap-2 justify-center p-2 bg-amber-50 rounded-xl border border-amber-200">
                    {Array.from({ length: currentProblem.num1 }).map((_, idx) => {
                      const isCrossed = subtractedIndices.includes(idx);
                      return (
                        <button
                          key={`sub_${idx}`}
                          onClick={() => toggleCrossItem(idx)}
                          className="relative text-3xl transition-transform active:scale-90"
                        >
                          <span className={isCrossed ? 'opacity-30 grayscale' : 'opacity-100'}>
                            {currentProblem.emoji}
                          </span>
                          {isCrossed && (
                            <span className="absolute inset-0 flex items-center justify-center text-red-500 font-bold text-2xl">
                              ❌
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Tingkat 3: Format Penjumlahan / Pengurangan Bersusun (SD Kelas 3-4) */
          <div className="flex flex-col items-center justify-center py-3">
            <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-300 w-44 flex flex-col items-end font-fredoka font-bold text-3xl text-slate-800 tracking-widest">
              <span>{currentProblem.num1}</span>
              <div className="flex items-center justify-between w-full border-b-2 border-slate-700 pb-1">
                <span className="text-xl text-amber-700">{opType === 'addition' ? '+' : '-'}</span>
                <span>{currentProblem.num2}</span>
              </div>
              <span className="text-blue-700 pt-1">
                {isAnswered ? correctAnswer : '??'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Format Hitung Susun ke Bawah</p>
          </div>
        )}

        {/* 4 Multiple Choice Options */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-slate-500">Pilih Jawaban yang Benar:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {options.map((opt) => {
              const isSelected = selectedAnswer === opt;
              const isCorrectOpt = opt === correctAnswer;

              let btnStyle = 'bg-slate-50 hover:bg-amber-50 border-slate-200 text-slate-800';
              if (isAnswered) {
                if (isCorrectOpt) {
                  btnStyle = 'bg-emerald-500 border-emerald-600 text-white font-bold ring-2 ring-emerald-300';
                } else if (isSelected && !isCorrectOpt) {
                  btnStyle = 'bg-rose-500 border-rose-600 text-white font-bold';
                } else {
                  btnStyle = 'bg-slate-100 text-slate-400 border-slate-200';
                }
              }

              return (
                <button
                  key={opt}
                  id={`math-opt-${opt}`}
                  onClick={() => handleSelectAnswer(opt)}
                  disabled={isAnswered}
                  className={`py-3.5 px-3 rounded-2xl font-fredoka font-bold text-2xl border-2 shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1 ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-white ml-1" />}
                  {isAnswered && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-white ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback & Next Problem button */}
        {isAnswered && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold">
              {selectedAnswer === correctAnswer ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Benar! +1 Bintang Emas!
                </span>
              ) : (
                <span className="text-rose-700">
                  Jawaban tepat adalah {correctAnswer}.
                </span>
              )}
            </div>

            <button
              id="btn-next-math-problem"
              onClick={() => loadNewProblem()}
              className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-fredoka font-bold text-sm rounded-xl shadow-sm active:scale-95"
            >
              Soal Selanjutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
