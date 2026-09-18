import React, { useState } from 'react';
import { 
  VOWELS_CONSONANTS, 
  SYLLABLE_SETS, 
  READING_WORDS, 
  READING_SENTENCES 
} from '../data/readingData';
import { playSound, speakIndonesian } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, BookOpen, Music2, CheckCircle } from 'lucide-react';

interface ReadingModuleProps {
  onEarnStar: () => void;
  onRecordReading: () => void;
}

export default function ReadingModule({ onEarnStar, onRecordReading }: ReadingModuleProps) {
  const [subTab, setSubTab] = useState<'letters' | 'syllables' | 'words' | 'sentences'>('words');
  const [speakingItem, setSpeakingItem] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(0.85); // 0.65 = pelan, 0.85 = normal

  const playVoice = async (id: string, text: string) => {
    setSpeakingItem(id);
    playSound('pop');
    await speakIndonesian(text, speechRate);
    setSpeakingItem(null);
    onRecordReading();
  };

  const handleSyllableTap = (syllable: string) => {
    playSound('pop');
    speakIndonesian(syllable, speechRate);
    onRecordReading();
  };

  const handleWordTap = (wordItem: typeof READING_WORDS[0]) => {
    playVoice(wordItem.id, wordItem.audioText);
    onEarnStar();
  };

  return (
    <div id="reading-module" className="flex flex-col gap-4 max-w-xl mx-auto pb-20">
      {/* Sub-tab Navigation */}
      <div className="bg-white/85 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-amber-100 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        <button
          id="read-subtab-words"
          onClick={() => { setSubTab('words'); playSound('click'); }}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            subTab === 'words'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-rose-50'
          }`}
        >
          📖 Kata Bergambar
        </button>
        <button
          id="read-subtab-syllables"
          onClick={() => { setSubTab('syllables'); playSound('click'); }}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            subTab === 'syllables'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-rose-50'
          }`}
        >
          🔤 Suku Kata (Ba-Bi-Bu)
        </button>
        <button
          id="read-subtab-letters"
          onClick={() => { setSubTab('letters'); playSound('click'); }}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            subTab === 'letters'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-rose-50'
          }`}
        >
          🗣️ Bunyi Huruf
        </button>
        <button
          id="read-subtab-sentences"
          onClick={() => { setSubTab('sentences'); playSound('click'); }}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            subTab === 'sentences'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-rose-50'
          }`}
        >
          📝 Kalimat Pendek
        </button>
      </div>

      {/* Voice Speed Toggle Banner */}
      <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-rose-900 font-semibold">
          <Volume2 className="w-4 h-4 text-rose-600" />
          <span>Contoh Suara Guru Perempuan:</span>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl p-0.5 border border-rose-200">
          <button
            id="speed-slow"
            onClick={() => { setSpeechRate(0.65); playSound('click'); }}
            className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all ${
              speechRate < 0.8 ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            🐢 Santai / Pelan
          </button>
          <button
            id="speed-normal"
            onClick={() => { setSpeechRate(0.85); playSound('click'); }}
            className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all ${
              speechRate >= 0.8 ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            🐇 Normal
          </button>
        </div>
      </div>

      {/* SUBTAB 1: KATA BERGAMBAR (Illustrated Words with Syllables) */}
      {subTab === 'words' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-500 px-1">
            Sentuh kotak suku kata atau gambar untuk mendengarkan suara pelafalannya:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {READING_WORDS.map((item) => (
              <div
                key={item.id}
                id={`read-card-${item.id}`}
                className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 hover:border-rose-200 hover:shadow-md transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl p-2 bg-amber-50 rounded-2xl shadow-inner">
                    {item.emoji}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-xl font-fredoka font-bold text-slate-800 tracking-wider">
                      {item.display}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{item.meaning}</p>
                  </div>
                </div>

                {/* Syllable blocks buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  {item.syllables?.map((syl, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSyllableTap(syl)}
                      className="flex-1 py-2 px-1 bg-amber-100/80 hover:bg-amber-200 text-amber-900 font-fredoka font-bold text-sm rounded-xl border border-amber-300 active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-xs"
                      title={`Bunyikan: ${syl}`}
                    >
                      <span>{syl}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => handleWordTap(item)}
                    className={`py-2 px-3 rounded-xl font-fredoka font-bold text-xs flex items-center gap-1 shadow-xs transition-transform active:scale-95 ${
                      speakingItem === item.id
                        ? 'bg-rose-600 text-white ring-2 ring-rose-300'
                        : 'bg-rose-500 hover:bg-rose-600 text-white'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Lengkap</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: SUKU KATA (Ba Bi Bu Be Bo) */}
      {subTab === 'syllables' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-500 px-1">
            Sentuh setiap suku kata untuk mendengarkan bunyi suaranya:
          </p>

          <div className="flex flex-col gap-3">
            {SYLLABLE_SETS.map((set) => (
              <div
                key={set.group}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-fredoka font-bold text-slate-700 text-sm flex items-center gap-2">
                    <span className="text-lg">{set.emoji}</span>
                    <span>Keluarga Huruf {set.group}</span>
                  </span>
                  <button
                    onClick={() => {
                      playSound('pop');
                      speakIndonesian(set.items.join(', '), speechRate);
                      onRecordReading();
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Bunyikan Semua</span>
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {set.items.map((syl) => (
                    <button
                      key={syl}
                      onClick={() => handleSyllableTap(syl)}
                      className="py-3 bg-gradient-to-b from-amber-50 to-amber-100/90 hover:from-amber-100 hover:to-amber-200 border-2 border-amber-300 text-amber-950 rounded-xl font-fredoka font-bold text-base shadow-xs active:scale-95 transition-all text-center"
                    >
                      {syl}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: BUNYI HURUF & FONIK */}
      {subTab === 'letters' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-500 px-1">
            Mengenal huruf vokal & konsonan utama beserta suaranya:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {VOWELS_CONSONANTS.map((item) => (
              <button
                key={item.id}
                onClick={() => playVoice(item.id, item.audioText)}
                className={`p-4 bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 active:scale-95 ${
                  speakingItem === item.id ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-100'
                }`}
              >
                <span className="text-3xl">{item.emoji}</span>
                <span className="text-2xl font-fredoka font-bold text-slate-800">
                  {item.display}
                </span>
                <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  <span>{item.meaning}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: KALIMAT PENDEK */}
      {subTab === 'sentences' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-500 px-1">
            Latihan membaca kalimat pendek dengan bimbingan audio perempuan:
          </p>

          <div className="flex flex-col gap-3">
            {READING_SENTENCES.map((sent) => (
              <div
                key={sent.id}
                className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl p-2 bg-emerald-50 rounded-2xl shadow-inner">
                    {sent.emoji}
                  </span>
                  <div className="flex-1">
                    <p className="font-fredoka font-semibold text-base text-slate-800 leading-relaxed">
                      "{sent.display}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      playVoice(sent.id, sent.audioText);
                      onEarnStar();
                    }}
                    className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 ${
                      speakingItem === sent.id
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Dengarkan Bacaan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
