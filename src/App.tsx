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
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
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
  Coins,
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

  // Android Native Hardware Back Button & Browser Navigation Handling
  useEffect(() => {
    let removeCapListener: (() => void) | null = null;
    try {
      if (Capacitor.isNativePlatform()) {
        CapApp.addListener('backButton', () => {
          if (showBadgesModal) {
            setShowBadgesModal(false);
            return;
          }
          if (showProfileModal) {
            setShowProfileModal(false);
            return;
          }
          if (newBadgeEarned) {
            setNewBadgeEarned(null);
            return;
          }
          if (activeTab !== 'home') {
            setActiveTab('home');
            return;
          }
          CapApp.exitApp();
        }).then((sub) => {
          removeCapListener = () => sub.remove();
        });
      }
    } catch {}

    const handlePopState = () => {
      if (showBadgesModal) {
        setShowBadgesModal(false);
      } else if (showProfileModal) {
        setShowProfileModal(false);
      } else if (newBadgeEarned) {
        setNewBadgeEarned(null);
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      if (removeCapListener) removeCapListener();
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showBadgesModal, showProfileModal, newBadgeEarned, activeTab]);

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
    try {
      window.history.pushState({ tab }, '', '');
    } catch {}
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
    <div className="h-[100dvh] w-full bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-yellow-50/50 md:bg-slate-100 text-slate-800 flex flex-col items-center justify-center p-0 md:p-3 select-none font-['Quicksand',sans-serif] overflow-hidden">
      {/* Responsive App Screen: edge-to-edge on mobile, wide & spacious on tablet, centered on desktop */}
      <div className="w-full h-full md:max-w-2xl lg:max-w-4xl bg-gradient-to-b from-amber-50 via-amber-50/90 to-orange-50/50 md:rounded-3xl md:shadow-xl md:border md:border-amber-200/80 flex flex-col overflow-hidden relative">
        {/* Top App Header Bar */}
        <header className="bg-white/95 backdrop-blur-md border-b border-amber-200/80 px-3.5 sm:px-6 py-2.5 flex items-center justify-between shrink-0 z-30 shadow-xs safe-top">
          {/* Child Avatar & Name */}
          <button
            id="btn-open-profile"
            onClick={() => { setShowProfileModal(true); playSound('click'); }}
            className="flex items-center gap-2.5 text-left p-1 rounded-2xl hover:bg-amber-50 active:scale-95 transition-all"
            title="Ubah Profil Anak"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl sm:text-2xl shadow-xs ring-2 ring-amber-200">
              {profile.avatar}
            </div>
            <div>
              <h1 className="font-fredoka font-bold text-slate-800 text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                <span>{profile.name}</span>
                <span className="text-[10px] sm:text-xs text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full font-bold">
                  {profile.age} thn
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-400">
                {profile.grade}
              </p>
            </div>
          </button>

          {/* Stars, Badges, Switch Account, Sound */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Stars pill */}
            <div className="flex items-center gap-1.5 bg-amber-100/90 text-amber-900 px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400 animate-pulse" />
              <span className="font-fredoka font-bold text-xs sm:text-sm">{profile.totalStars}</span>
            </div>

            {/* Badges Trophy button */}
            <button
              id="btn-open-badges"
              onClick={() => { setShowBadgesModal(true); playSound('click'); }}
              className="p-2 sm:p-2.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl active:scale-95 transition-all relative"
              title="Lihat Lencana Prestasi"
            >
              <Trophy className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {profile.unlockedBadges.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
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
              className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl active:scale-95 transition-all"
              title="Ganti Akun Murid"
            >
              <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Sound toggle */}
            <button
              id="btn-toggle-sound"
              onClick={toggleSound}
              className={`p-2 sm:p-2.5 rounded-xl active:scale-95 transition-all ${
                soundOn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
              }`}
              title={soundOn ? 'Suara Aktif' : 'Suara Dimatikan'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
            </button>
          </div>
        </header>

        {/* 3. Main Content Area */}
        <main className="flex-1 px-3 sm:px-6 py-3 sm:py-5 overflow-y-auto no-scrollbar relative flex flex-col">
          {/* TAB: HOME / BERANDA */}
          {activeTab === 'home' && (
            <div className="flex flex-col gap-3.5 sm:gap-5 max-w-md sm:max-w-2xl lg:max-w-3xl mx-auto w-full pb-24">
              {/* Cheerful Greeting Hero Banner */}
              <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-3xl p-4 sm:p-6 text-white shadow-sm relative overflow-hidden shrink-0">
                <div className="relative z-10 max-w-[85%]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-100">
                    <Sparkles className="w-4 h-4 text-yellow-200" />
                    <span>Anak Pintar Belajar</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-fredoka font-bold mt-1 leading-tight">
                    Halo, {profile.name}! 👋
                  </h2>
                  <p className="text-xs sm:text-sm text-white/90 mt-1 leading-relaxed">
                    Ayo pilih pelajaran hari ini, kumpulkan bintang emas, dan buka semua lencana prestasi!
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      id="btn-hero-quiz"
                      onClick={() => changeTab('quiz')}
                      className="py-2 px-4 bg-white text-orange-600 font-fredoka font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-sm hover:bg-amber-50 active:scale-95 flex items-center gap-1.5 transition-all"
                    >
                      <span>Mulai Kuis Cerdas (Lvl {profile.highestLevelUnlocked})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Decorative big emoji */}
                <div className="absolute -bottom-3 -right-2 text-6xl sm:text-7xl opacity-80 select-none pointer-events-none transform -rotate-12">
                  🌟
                </div>
              </div>

              {/* 4 Main Subject Learning Cards: 2-col on mobile, 4-col on tablet/desktop */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-fredoka font-bold text-slate-800 text-sm sm:text-base">
                    Pilih Menu Belajar:
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    Disukai anak usia 6-10 tahun
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
                  {/* 1. Menulis */}
                  <button
                    id="card-menulis"
                    onClick={() => changeTab('writing')}
                    className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs border-2 border-blue-200 hover:border-blue-400 hover:shadow-md active:scale-98 transition-all flex flex-col items-start text-left relative overflow-hidden group cursor-pointer"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-xl sm:text-2xl shadow-xs mb-2 group-hover:scale-105 transition-transform">
                      ✍️
                    </div>
                    <h4 className="font-fredoka font-bold text-slate-800 text-sm sm:text-base leading-tight">
                      Menulis
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
                      Huruf besar, kecil, angka &amp; kata bergambar
                    </p>
                    <div className="mt-2 text-xs font-bold text-blue-600 flex items-center gap-0.5">
                      <span>Buka Pelajaran</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {/* 2. Membaca */}
                  <button
                    id="card-membaca"
                    onClick={() => changeTab('reading')}
                    className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs border-2 border-rose-200 hover:border-rose-400 hover:shadow-md active:scale-98 transition-all flex flex-col items-start text-left relative overflow-hidden group cursor-pointer"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center text-xl sm:text-2xl shadow-xs mb-2 group-hover:scale-105 transition-transform">
                      📖
                    </div>
                    <h4 className="font-fredoka font-bold text-slate-800 text-sm sm:text-base leading-tight">
                      Membaca
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
                      Suara perempuan jernih: kata &amp; kalimat pendek
                    </p>
                    <div className="mt-2 text-xs font-bold text-rose-600 flex items-center gap-0.5">
                      <span>Buka Pelajaran</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {/* 3. Matematika */}
                  <button
                    id="card-matematika"
                    onClick={() => changeTab('math')}
                    className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-md active:scale-98 transition-all flex flex-col items-start text-left relative overflow-hidden group cursor-pointer"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center text-xl sm:text-2xl shadow-xs mb-2 group-hover:scale-105 transition-transform">
                      🧮
                    </div>
                    <h4 className="font-fredoka font-bold text-slate-800 text-sm sm:text-base leading-tight">
                      Matematika
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
                      Penjumlahan &amp; pengurangan interaktif
                    </p>
                    <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                      <span>Buka Pelajaran</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>

                  {/* 4. Kuis 200 Level */}
                  <button
                    id="card-kuis"
                    onClick={() => changeTab('quiz')}
                    className="bg-gradient-to-br from-white to-amber-50 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs border-2 border-amber-300 hover:border-amber-500 hover:shadow-md active:scale-98 transition-all flex flex-col items-start text-left relative overflow-hidden group cursor-pointer"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl sm:text-2xl shadow-xs mb-2 group-hover:scale-105 transition-transform">
                      🎯
                    </div>
                    <h4 className="font-fredoka font-bold text-slate-800 text-sm sm:text-base leading-tight">
                      Kuis 200 Lvl
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
                      10 soal/level &amp; raih 3 bintang emas
                    </p>
                    <div className="mt-2 text-xs font-bold text-amber-600 flex items-center gap-0.5">
                      <span>Mulai Kuis</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Progress Summary & Rest Shortcut in 2 columns on tablet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Stats Summary Card */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs border border-amber-200/80 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-fredoka font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>📊 Catatan Belajar</span>
                    </h4>
                    <span className="text-[11px] text-amber-700 bg-amber-50 font-bold px-2 py-0.5 rounded-lg border border-amber-200">
                      Tingkat: {profile.difficulty.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-amber-50/80 rounded-xl p-2 border border-amber-200/60">
                      <div className="text-lg sm:text-xl font-fredoka font-bold text-amber-700">
                        {profile.totalStars}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">Bintang Emas</div>
                    </div>
                    <div className="bg-rose-50/80 rounded-xl p-2 border border-rose-200/60">
                      <div className="text-lg sm:text-xl font-fredoka font-bold text-rose-700">
                        {profile.stats.wordsRead}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">Kata Dibaca</div>
                    </div>
                    <div className="bg-blue-50/80 rounded-xl p-2 border border-blue-200/60">
                      <div className="text-lg sm:text-xl font-fredoka font-bold text-blue-700">
                        {profile.stats.writingPracticed}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">Latihan Tulis</div>
                    </div>
                  </div>
                </div>

                {/* Istirahat Game Card */}
                <div className="bg-gradient-to-br from-teal-50 via-emerald-50 to-amber-50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs border border-teal-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center text-2xl shadow-xs shrink-0">
                      🎮
                    </div>
                    <div>
                      <h4 className="font-fredoka font-bold text-slate-800 text-xs sm:text-sm leading-tight">
                        Waktu Istirahat (Game Apel)
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        Maks 15 menit bermain dengan jeda santai
                      </p>
                    </div>
                  </div>
                  <button
                    id="btn-play-istirahat-home"
                    onClick={() => changeTab('istirahat')}
                    className="py-2 px-3.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-fredoka font-bold text-xs rounded-xl shadow-xs shrink-0 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Main</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
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

          {/* 4. Floating Bottom Navigation Bar: thumb-friendly on phone, spacious on tablet */}
          <nav
            id="floating-nav-bar"
            className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 max-w-[420px] sm:max-w-lg md:max-w-xl mx-auto bg-white/95 backdrop-blur-xl border border-white/90 shadow-[0_10px_35px_rgba(0,0,0,0.12)] rounded-full px-2 sm:px-4 py-1.5 flex items-center justify-around z-40 ring-1 ring-slate-900/5"
          >
            <button
              id="nav-home"
              onClick={() => changeTab('home')}
              className={`flex flex-col items-center gap-0.5 py-1 sm:py-1.5 px-2.5 sm:px-4 rounded-2xl sm:rounded-full transition-all active:scale-95 ${
                activeTab === 'home'
                  ? 'bg-amber-100 text-amber-800 font-bold shadow-xs scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[11px] font-fredoka leading-none">Beranda</span>
            </button>

            <button
              id="nav-writing"
              onClick={() => changeTab('writing')}
              className={`flex flex-col items-center gap-0.5 py-1 sm:py-1.5 px-2.5 sm:px-4 rounded-2xl sm:rounded-full transition-all active:scale-95 ${
                activeTab === 'writing'
                  ? 'bg-blue-100 text-blue-800 font-bold shadow-xs scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[11px] font-fredoka leading-none">Menulis</span>
            </button>

            <button
              id="nav-reading"
              onClick={() => changeTab('reading')}
              className={`flex flex-col items-center gap-0.5 py-1 sm:py-1.5 px-2.5 sm:px-4 rounded-2xl sm:rounded-full transition-all active:scale-95 ${
                activeTab === 'reading'
                  ? 'bg-rose-100 text-rose-800 font-bold shadow-xs scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[11px] font-fredoka leading-none">Membaca</span>
            </button>

            <button
              id="nav-math"
              onClick={() => changeTab('math')}
              className={`flex flex-col items-center gap-0.5 py-1 sm:py-1.5 px-2.5 sm:px-4 rounded-2xl sm:rounded-full transition-all active:scale-95 ${
                activeTab === 'math'
                  ? 'bg-emerald-100 text-emerald-800 font-bold shadow-xs scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[11px] font-fredoka leading-none">Matematika</span>
            </button>

            <button
              id="nav-quiz"
              onClick={() => changeTab('quiz')}
              className={`flex flex-col items-center gap-0.5 py-1 sm:py-1.5 px-2.5 sm:px-4 rounded-2xl sm:rounded-full transition-all active:scale-95 ${
                activeTab === 'quiz'
                  ? 'bg-amber-100 text-amber-800 font-bold shadow-xs scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute -top-1 -right-2 text-[7px] sm:text-[8px] bg-amber-500 text-white px-1 rounded-full font-bold leading-none">
                  200
                </span>
              </div>
              <span className="text-[9px] sm:text-[11px] font-fredoka leading-none">Kuis</span>
            </button>

            <button
              id="nav-istirahat"
              onClick={() => changeTab('istirahat')}
              className={`flex flex-col items-center gap-0.5 py-1 sm:py-1.5 px-2.5 sm:px-4 rounded-2xl sm:rounded-full transition-all active:scale-95 ${
                activeTab === 'istirahat'
                  ? 'bg-teal-100 text-teal-800 font-bold shadow-xs scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[11px] font-fredoka leading-none">Istirahat</span>
            </button>
          </nav>
        </div>

      {/* Fullscreen Istirahat Mode */}
      {activeTab === 'istirahat' && (
        <div
          id="fullscreen-istirahat-container"
          className="fixed inset-0 z-50 bg-slate-900 flex flex-col text-slate-800 overflow-y-auto animate-in fade-in"
        >
          {/* Top Fullscreen Header with Prominent Exit Button */}
          <header className="bg-slate-900/95 backdrop-blur-md px-4 sm:px-8 py-3 border-b border-slate-800 flex items-center justify-between sticky top-0 z-50 text-white shadow-md safe-top">
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
              className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 active:scale-95 text-white font-fredoka font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-1.5 border border-rose-300 transition-all cursor-pointer"
              title="Keluar dari game dan kembali ke beranda belajar"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Keluar</span>
            </button>
          </header>

          {/* Fullscreen Body */}
          <main className="flex-1 w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto p-3.5 sm:p-6 flex flex-col justify-start">
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
