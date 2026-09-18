import React, { useState, useEffect } from 'react';
import { TabType, UserProfile, Badge, DifficultyLevel } from './types';
import WritingModule from './components/WritingModule';
import ReadingModule from './components/ReadingModule';
import MathModule from './components/MathModule';
import QuizModule from './components/QuizModule';
import IstirahatModule from './components/IstirahatModule';
import BadgesModal from './components/BadgesModal';
import ProfileModal from './components/ProfileModal';
import AuthScreen from './components/AuthScreen';
import { checkNewBadges } from './data/badgesData';
import { playSound, isSoundEnabled, setSoundEnabled, speakIndonesian } from './utils/audio';
import { 
  getActiveUserId, 
  getLocalProfile, 
  saveLocalProfile, 
  setActiveUserId, 
  INITIAL_DEFAULT_PROFILE 
} from './utils/localAuth';
import confetti from 'canvas-confetti';
import {
  Home,
  Pencil,
  BookOpen,
  Calculator,
  Trophy,
  Star,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronRight,
  Gamepad2,
  LogOut,
  X
} from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const activeId = getActiveUserId();
    if (activeId && getLocalProfile(activeId)) return true;
    return false;
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const activeId = getActiveUserId();
    if (activeId) {
      const saved = getLocalProfile(activeId);
      if (saved) return saved;
    }
    return INITIAL_DEFAULT_PROFILE;
  });

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [showBadgesModal, setShowBadgesModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [newBadgeEarned, setNewBadgeEarned] = useState<Badge | null>(null);

  // Save profile changes locally to the user's phone storage
  useEffect(() => {
    if (profile && profile.id) {
      saveLocalProfile(profile);
    }
  }, [profile]);

  // Check badges whenever profile stats update
  useEffect(() => {
    const { updatedUnlocked, newlyEarned } = checkNewBadges(profile);
    if (newlyEarned.length > 0) {
      const latest = newlyEarned[0];
      setNewBadgeEarned(latest);
      playSound('badge');
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.4 },
      });
      speakIndonesian(`Selamat! Kamu mendapatkan lencana baru: ${latest.title}!`);
      setProfile((prev) => ({
        ...prev,
        unlockedBadges: updatedUnlocked,
      }));
    }
  }, [profile.stats, profile.totalStars, profile.highestLevelUnlocked]);

  const handleEarnStar = () => {
    setProfile((prev) => ({
      ...prev,
      totalStars: prev.totalStars + 1,
      totalCoins: prev.totalCoins + 5,
    }));
  };

  const handleRecordWriting = () => {
    setProfile((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        writingPracticed: prev.stats.writingPracticed + 1,
      },
    }));
  };

  const handleRecordReading = () => {
    setProfile((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        wordsRead: prev.stats.wordsRead + 1,
      },
    }));
  };

  const handleRecordMath = () => {
    setProfile((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        mathSolved: prev.stats.mathSolved + 1,
      },
    }));
  };

  const handleCompleteQuizLevel = (levelNum: number, score: number, stars: number, correctCount: number) => {
    setProfile((prev) => {
      const isNewUnlock = score >= 60 && levelNum === prev.highestLevelUnlocked && levelNum < 200;
      const newHighest = isNewUnlock ? levelNum + 1 : prev.highestLevelUnlocked;
      const prevStars = prev.levelScores[levelNum]?.stars || 0;
      const starsGained = Math.max(0, stars - prevStars);

      return {
        ...prev,
        totalStars: prev.totalStars + starsGained,
        totalCoins: prev.totalCoins + score,
        highestLevelUnlocked: newHighest,
        levelScores: {
          ...prev.levelScores,
          [levelNum]: {
            score,
            stars,
            completedAt: new Date().toISOString(),
          },
        },
        stats: {
          ...prev.stats,
          quizCompleted: prev.stats.quizCompleted + 1,
          perfectQuizzes: score === 100 ? prev.stats.perfectQuizzes + 1 : prev.stats.perfectQuizzes,
          correctAnswersCount: prev.stats.correctAnswersCount + correctCount,
        },
      };
    });
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playSound('pop');
  };

  const changeTab = (tab: TabType) => {
    playSound('click');
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user is not logged in, show the child profile login screen
  if (!isLoggedIn) {
    return (
      <AuthScreen
        onLoginSuccess={(loggedInUser) => {
          setProfile(loggedInUser);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-slate-900 text-slate-800 flex flex-col items-center justify-center p-0 sm:p-3 select-none font-['Quicksand',sans-serif] overflow-hidden">
      {/* Smartphone Shell: neatly fits 1 phone screen on mobile and centered phone frame on desktop */}
      <div className="w-full max-w-[430px] h-full sm:h-[min(96vh,860px)] bg-slate-950 sm:rounded-[42px] sm:p-2.5 sm:shadow-2xl sm:ring-8 sm:ring-slate-800/80 flex flex-col justify-center overflow-hidden">
        {/* Android Device Body Inner Screen */}
        <div className="w-full h-full bg-gradient-to-b from-amber-50 via-amber-50/70 to-orange-50/40 rounded-none sm:rounded-[34px] overflow-hidden flex flex-col relative shadow-inner border sm:border-amber-100/80">
          {/* 1. Android Status Bar */}
          <div className="bg-amber-100/80 backdrop-blur-md px-5 py-1.5 flex items-center justify-between text-slate-700 text-[11px] font-bold border-b border-amber-200/50 shrink-0 z-20">
            <span>09:41</span>
            {/* Camera Punch Hole */}
            <div className="w-3.5 h-3.5 rounded-full bg-slate-900 mx-auto shadow-inner" />
            <div className="flex items-center gap-1.5 text-[10px]">
              <span>4G</span>
              <span>📶</span>
              <span>100% 🔋</span>
            </div>
          </div>

          {/* 2. Top App Header Bar */}
          <header className="bg-white/95 backdrop-blur-md border-b border-amber-200/80 px-3 py-2 flex items-center justify-between shrink-0 z-30 shadow-xs">
            {/* Child Avatar & Name */}
            <button
              id="btn-open-profile"
              onClick={() => { setShowProfileModal(true); playSound('click'); }}
              className="flex items-center gap-2 text-left p-1 rounded-2xl hover:bg-amber-50 active:scale-95 transition-all"
              title="Ubah Profil Anak"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-lg shadow-xs ring-2 ring-amber-200">
                {profile.avatar}
              </div>
              <div>
                <h1 className="font-fredoka font-bold text-slate-800 text-xs leading-tight flex items-center gap-1">
                  <span>{profile.name}</span>
                  <span className="text-[9px] text-amber-600 bg-amber-100 px-1.5 py-0.2 rounded-full font-bold">
                    {profile.age} thn
                  </span>
                </h1>
                <p className="text-[10px] font-semibold text-slate-400">
                  {profile.grade}
                </p>
              </div>
            </button>

            {/* Stars Counter & Tools */}
            <div className="flex items-center gap-1.5">
              {/* Stars pill */}
              <div className="flex items-center gap-1 bg-amber-100/90 text-amber-900 px-2 py-1 rounded-xl border border-amber-300 shadow-xs">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-pulse" />
                <span className="font-fredoka font-bold text-xs">{profile.totalStars}</span>
              </div>

              {/* Badges Trophy button */}
              <button
                id="btn-open-badges"
                onClick={() => { setShowBadgesModal(true); playSound('click'); }}
                className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl active:scale-95 transition-all relative"
                title="Lihat Lencana Prestasi"
              >
                <Trophy className="w-4 h-4" />
                {profile.unlockedBadges.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {profile.unlockedBadges.length}
                  </span>
                )}
              </button>

              {/* Switch Account */}
              <button
                id="btn-switch-account-header"
                onClick={() => {
                  playSound('click');
                  setActiveUserId(null);
                  setIsLoggedIn(false);
                }}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl active:scale-95 transition-all"
                title="Ganti Akun Murid"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Sound toggle */}
              <button
                id="btn-toggle-sound"
                onClick={toggleSound}
                className={`p-1.5 rounded-xl active:scale-95 transition-all ${
                  soundOn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                }`}
                title={soundOn ? 'Suara Aktif' : 'Suara Dimatikan'}
              >
                {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* 3. Main Content Area */}
          <main className="flex-1 px-3 py-2.5 overflow-y-auto no-scrollbar relative flex flex-col">
            {/* TAB: HOME / BERANDA */}
            {activeTab === 'home' && (
              <div className="flex flex-col gap-2.5 max-w-md mx-auto w-full pb-20">
                {/* Cheerful Greeting Hero Banner */}
                <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-2xl p-3 text-white shadow-xs relative overflow-hidden shrink-0">
                  <div className="relative z-10">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-100">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                      <span>Anak Pintar</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-fredoka font-bold mt-0.5 leading-tight">
                      Halo, {profile.name}! 👋
                    </h2>
                    <p className="text-[11px] text-white/90 mt-0.5 leading-tight">
                      Pilih pelajaran hari ini & raih bintang emas!
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        id="btn-hero-quiz"
                        onClick={() => changeTab('quiz')}
                        className="py-1 px-3 bg-white text-orange-600 font-fredoka font-bold text-xs rounded-xl shadow-xs hover:bg-amber-50 active:scale-95 flex items-center gap-1"
                      >
                        <span>Mulai Kuis (Lvl {profile.highestLevelUnlocked})</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Decorative big emoji */}
                  <div className="absolute -bottom-2 -right-1 text-5xl opacity-80 select-none pointer-events-none transform -rotate-12">
                    🌟
                  </div>
                </div>

                {/* 4 Main Subject Learning Cards in a neat 2x2 Grid */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-fredoka font-bold text-slate-700 text-xs px-1">
                    Pilih Menu Belajar:
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    {/* 1. Menulis */}
                    <button
                      id="card-menulis"
                      onClick={() => changeTab('writing')}
                      className="bg-white rounded-2xl p-2.5 shadow-xs border-2 border-blue-200 hover:border-blue-400 active:scale-98 transition-all flex flex-col items-start text-left relative overflow-hidden"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-lg shadow-xs mb-1.5">
                        ✍️
                      </div>
                      <h4 className="font-fredoka font-bold text-slate-800 text-xs sm:text-sm leading-tight">
                        Menulis
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight line-clamp-2">
                        Huruf, angka & kata bergambar
                      </p>
                      <div className="mt-1.5 text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                        <span>Buka</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </button>

                    {/* 2. Membaca */}
                    <button
                      id="card-membaca"
                      onClick={() => changeTab('reading')}
                      className="bg-white rounded-2xl p-2.5 shadow-xs border-2 border-rose-200 hover:border-rose-400 active:scale-98 transition-all flex flex-col items-start text-left relative overflow-hidden"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center text-lg shadow-xs mb-1.5">
                        📖
                      </div>
                      <h4 className="font-fredoka font-bold text-slate-800 text-xs sm:text-sm leading-tight">
                        Membaca
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight line-clamp-2">
                        Suara perempuan: kata & kalimat
                      </p>
                      <div className="mt-1.5 text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                        <span>Buka</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </button>

                    {/* 3. Matematika */}
                    <button
                      id="card-matematika"
                      onClick={() => changeTab('math')}
                      className="bg-white rounded-2xl p-2.5 shadow-xs border-2 border-emerald-200 hover:border-emerald-400 active:scale-98 transition-all flex flex-col items-start text-left relative overflow-hidden"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center text-lg shadow-xs mb-1.5">
                        🧮
                      </div>
                      <h4 className="font-fredoka font-bold text-slate-800 text-xs sm:text-sm leading-tight">
                        Matematika
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight line-clamp-2">
                        Tambah & kurang interaktif
                      </p>
                      <div className="mt-1.5 text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                        <span>Buka</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </button>

                    {/* 4. Kuis 200 Level */}
                    <button
                      id="card-kuis"
                      onClick={() => changeTab('quiz')}
                      className="bg-gradient-to-br from-white to-amber-50 rounded-2xl p-2.5 shadow-xs border-2 border-amber-300 hover:border-amber-500 active:scale-98 transition-all flex flex-col items-start text-left relative overflow-hidden"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-lg shadow-xs mb-1.5">
                        🎯
                      </div>
                      <h4 className="font-fredoka font-bold text-slate-800 text-xs sm:text-sm leading-tight">
                        Kuis 200 Lvl
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight line-clamp-2">
                        10 soal/lvl & 3 bintang emas
                      </p>
                      <div className="mt-1.5 text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                        <span>Main</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Progress & Badge teaser bar */}
                <div className="bg-white rounded-2xl p-2.5 shadow-xs border border-amber-200/70 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Trophy className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h5 className="font-fredoka font-bold text-xs text-slate-800 leading-tight">
                        Lencana Prestasi
                      </h5>
                      <p className="text-[10px] text-slate-500">
                        {profile.unlockedBadges.length} terbuka dari 8 lencana
                      </p>
                    </div>
                  </div>
                  <button
                    id="btn-open-badges-home"
                    onClick={() => { setShowBadgesModal(true); playSound('click'); }}
                    className="text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-xl border border-purple-200 active:scale-95"
                  >
                    Lihat →
                  </button>
                </div>
              </div>
            )}

            {/* TAB: CARA MENULIS */}
            {activeTab === 'writing' && (
              <div className="pb-20">
                <WritingModule
                  onEarnStar={handleEarnStar}
                  onRecordWriting={handleRecordWriting}
                />
              </div>
            )}

            {/* TAB: CARA MEMBACA */}
            {activeTab === 'reading' && (
              <div className="pb-20">
                <ReadingModule
                  onEarnStar={handleEarnStar}
                  onRecordReading={handleRecordReading}
                />
              </div>
            )}

            {/* TAB: MATEMATIKA DASAR */}
            {activeTab === 'math' && (
              <div className="pb-20">
                <MathModule
                  onEarnStar={handleEarnStar}
                  onRecordMath={handleRecordMath}
                />
              </div>
            )}

            {/* TAB: KUIS 200 LEVEL */}
            {activeTab === 'quiz' && (
              <div className="pb-20">
                <QuizModule
                  userProfile={profile}
                  onCompleteLevel={handleCompleteQuizLevel}
                  onUpdateDifficulty={(newDiff) => setProfile((prev) => ({ ...prev, difficulty: newDiff }))}
                />
              </div>
            )}
          </main>

          {/* 4. Floating Bottom Navigation Bar */}
          <nav
            id="floating-nav-bar"
            className="absolute bottom-3 left-2.5 right-2.5 max-w-[390px] mx-auto bg-white/92 backdrop-blur-xl border border-white/90 shadow-[0_10px_35px_rgba(0,0,0,0.15)] rounded-full px-1.5 py-1 flex items-center justify-around z-40 ring-1 ring-slate-900/5"
          >
            <button
              id="nav-home"
              onClick={() => changeTab('home')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-full transition-all active:scale-95 ${
                activeTab === 'home'
                  ? 'bg-amber-100 text-amber-800 font-bold shadow-xs scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[9px] font-fredoka leading-none">Beranda</span>
            </button>

            <button
              id="nav-writing"
              onClick={() => changeTab('writing')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-full transition-all active:scale-95 ${
                activeTab === 'writing'
                  ? 'bg-blue-100 text-blue-800 font-bold shadow-xs scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Pencil className="w-4 h-4" />
              <span className="text-[9px] font-fredoka leading-none">Menulis</span>
            </button>

            <button
              id="nav-reading"
              onClick={() => changeTab('reading')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-full transition-all active:scale-95 ${
                activeTab === 'reading'
                  ? 'bg-rose-100 text-rose-800 font-bold shadow-xs scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-[9px] font-fredoka leading-none">Membaca</span>
            </button>

            <button
              id="nav-math"
              onClick={() => changeTab('math')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-full transition-all active:scale-95 ${
                activeTab === 'math'
                  ? 'bg-emerald-100 text-emerald-800 font-bold shadow-xs scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span className="text-[9px] font-fredoka leading-none">Matematika</span>
            </button>

            <button
              id="nav-quiz"
              onClick={() => changeTab('quiz')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-full transition-all active:scale-95 ${
                activeTab === 'quiz'
                  ? 'bg-amber-100 text-amber-800 font-bold shadow-xs scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Trophy className="w-4 h-4" />
                <span className="absolute -top-1 -right-2 text-[7px] bg-amber-500 text-white px-1 rounded-full font-bold leading-none">
                  200
                </span>
              </div>
              <span className="text-[9px] font-fredoka leading-none">Kuis</span>
            </button>

            <button
              id="nav-istirahat"
              onClick={() => changeTab('istirahat')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-full transition-all active:scale-95 ${
                activeTab === 'istirahat'
                  ? 'bg-teal-100 text-teal-800 font-bold shadow-xs scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span className="text-[9px] font-fredoka leading-none">Istirahat</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Fullscreen Istirahat Mode */}
      {activeTab === 'istirahat' && (
        <div
          id="fullscreen-istirahat-container"
          className="fixed inset-0 z-50 bg-slate-900 flex flex-col text-slate-800 overflow-y-auto animate-in fade-in"
        >
          {/* Top Fullscreen Header with Prominent Exit Button */}
          <header className="bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-2.5 border-b border-slate-800 flex items-center justify-between sticky top-0 z-50 text-white shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl select-none">🎮</span>
              <div>
                <h2 className="font-fredoka font-bold text-sm sm:text-base text-amber-300 leading-tight">
                  Waktu Istirahat (Game Apel)
                </h2>
                <p className="text-[11px] text-slate-400">
                  Anak Pintar • Kumpulkan buah apel santai
                </p>
              </div>
            </div>

            {/* Exit Button */}
            <button
              id="btn-exit-istirahat-fullscreen"
              onClick={() => {
                playSound('click');
                changeTab('home');
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 active:scale-95 text-white font-fredoka font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-1.5 border border-rose-300 transition-all cursor-pointer"
              title="Keluar dari game dan kembali ke beranda belajar"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Keluar</span>
            </button>
          </header>

          {/* Fullscreen Body */}
          <main className="flex-1 w-full max-w-xl mx-auto p-3.5 sm:p-5 flex flex-col justify-start">
            <IstirahatModule
              onNavigateTab={(tab) => changeTab(tab)}
              onEarnStar={handleEarnStar}
              onExit={() => changeTab('home')}
            />
          </main>
        </div>
      )}

      {/* Modals */}
      {showBadgesModal && (
        <BadgesModal
          userProfile={profile}
          onClose={() => setShowBadgesModal(false)}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          userProfile={profile}
          onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
          onSwitchAccount={() => {
            setShowProfileModal(false);
            setActiveUserId(null);
            setIsLoggedIn(false);
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Celebration Popup when new badge earned */}
      {newBadgeEarned && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in zoom-in-95">
          <div className="bg-white rounded-3xl p-6 text-center max-w-xs w-full shadow-2xl border-4 border-amber-400 flex flex-col items-center gap-3">
            <div className="text-5xl animate-bounce">
              {newBadgeEarned.icon}
            </div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
              Lencana Baru Terbuka!
            </span>
            <h3 className="font-fredoka font-bold text-xl text-slate-800">
              {newBadgeEarned.title}
            </h3>
            <p className="text-xs text-slate-500">
              {newBadgeEarned.description}
            </p>
            <button
              onClick={() => { setNewBadgeEarned(null); playSound('click'); }}
              className="mt-2 w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-fredoka font-bold text-sm rounded-xl shadow-md active:scale-95"
            >
              Keren Banget!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
