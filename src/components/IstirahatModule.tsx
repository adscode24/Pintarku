import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCharacter, CharacterOption } from '../types';
import { playSound, speakIndonesian } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Gamepad2,
  Clock,
  Apple,
  RotateCcw,
  Sparkles,
  Trophy,
  BookOpen,
  Pencil,
  Calculator,
  Flame,
  Volume2,
  AlertCircle,
  Play,
  Pause,
  ChevronRight,
  ShieldAlert,
  Coffee,
  LogOut,
  X
} from 'lucide-react';

interface IstirahatModuleProps {
  onNavigateTab: (tab: 'home' | 'writing' | 'reading' | 'math' | 'quiz') => void;
  onEarnStar?: () => void;
  onExit?: () => void;
}

const CHARACTERS: CharacterOption[] = [
  {
    id: 'burung',
    name: 'Burung Ceria',
    emoji: '🐦',
    color: 'from-amber-400 to-yellow-500',
    description: 'Terbang lincah di angkasa',
  },
  {
    id: 'dino',
    name: 'Dino Gesit',
    emoji: '🦖',
    color: 'from-emerald-400 to-teal-500',
    description: 'Melompat tinggi petualang',
  },
  {
    id: 'kucing',
    name: 'Kucing Terbang',
    emoji: '🐱',
    color: 'from-orange-400 to-rose-400',
    description: 'Imut dan selalu penasaran',
  },
  {
    id: 'unicorn',
    name: 'Unicorn Ajaib',
    emoji: '🦄',
    color: 'from-purple-400 to-pink-500',
    description: 'Penuh bintang dan pelangi',
  },
];

const MAX_PLAY_QUOTA_SECONDS = 15 * 60; // 15 Menit = 900 detik
const COOLDOWN_DURATION_SECONDS = 10 * 60; // 10 Menit = 600 detik

const STORAGE_KEYS = {
  QUOTA_REMAINING: 'bintang_istirahat_quota_v1',
  COOLDOWN_UNTIL: 'bintang_istirahat_cooldown_until_v1',
  HIGH_SCORE: 'bintang_istirahat_highscore_v1',
  SELECTED_CHAR: 'bintang_istirahat_char_v1',
  TOTAL_PLAYED_TIME: 'bintang_istirahat_total_played_v1',
};

interface CollectibleApple {
  x: number;
  y: number;
  size: number;
  collected: boolean;
  floatOffset: number;
  isGolden?: boolean;
  points: number;
}

interface FloatingScore {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export default function IstirahatModule({ onNavigateTab, onEarnStar, onExit }: IstirahatModuleProps) {
  // Persistence state
  const [selectedChar, setSelectedChar] = useState<GameCharacter>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_CHAR);
      if (saved && (saved === 'burung' || saved === 'dino' || saved === 'kucing' || saved === 'unicorn')) {
        return saved as GameCharacter;
      }
    } catch (e) {
      console.warn(e);
    }
    return 'burung';
  });

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [quotaRemainingSeconds, setQuotaRemainingSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUOTA_REMAINING);
      return saved !== null ? parseInt(saved, 10) : MAX_PLAY_QUOTA_SECONDS;
    } catch {
      return MAX_PLAY_QUOTA_SECONDS;
    }
  });

  const [cooldownUntil, setCooldownUntil] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COOLDOWN_UNTIL);
      if (saved) {
        const until = parseInt(saved, 10);
        if (until > Date.now()) return until;
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Game execution state
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [applesCollected, setApplesCollected] = useState<number>(0);
  const [sessionTimeSeconds, setSessionTimeSeconds] = useState<number>(0);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Game internal physics & entities ref
  const gameRef = useRef({
    charY: 180,
    charVy: 0,
    gravity: 0.36,
    jumpForce: -6.4,
    canvasWidth: 380,
    canvasHeight: 460,
    apples: [] as CollectibleApple[],
    particles: [] as Particle[],
    floatingScores: [] as FloatingScore[],
    speed: 2.2,
    frameCount: 0,
    charRotation: 0,
    groundY: 420,
    currentScore: 0,
    currentSurvivalSec: 0,
  });

  // Save selected char
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_CHAR, selectedChar);
    } catch (e) {
      console.warn(e);
    }
  }, [selectedChar]);

  // Save quota and cooldown
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUOTA_REMAINING, quotaRemainingSeconds.toString());
      if (cooldownUntil) {
        localStorage.setItem(STORAGE_KEYS.COOLDOWN_UNTIL, cooldownUntil.toString());
      } else {
        localStorage.removeItem(STORAGE_KEYS.COOLDOWN_UNTIL);
      }
    } catch (e) {
      console.warn(e);
    }
  }, [quotaRemainingSeconds, cooldownUntil]);

  // Check cooldown tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (cooldownUntil) {
        const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
        setCooldownRemainingSeconds(remaining);
        if (remaining <= 0) {
          // Cooldown finished! Reset quota!
          setCooldownUntil(null);
          setQuotaRemainingSeconds(MAX_PLAY_QUOTA_SECONDS);
          playSound('victory');
          speakIndonesian('Waktu istirahat selesai! Kamu bisa bermain lagi sekarang.');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownUntil]);

  // Playtime counting timer while in 'playing' state
  useEffect(() => {
    if (gameState !== 'playing' || cooldownUntil !== null) return;

    const interval = setInterval(() => {
      setSessionTimeSeconds((prev) => prev + 1);
      gameRef.current.currentSurvivalSec += 1;

      setQuotaRemainingSeconds((prevQuota) => {
        const nextQuota = prevQuota - 1;
        if (nextQuota <= 0) {
          // QUOTA EXHAUSTED! Trigger 10-minute cooldown
          triggerCooldown();
          return 0;
        }
        return nextQuota;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, cooldownUntil]);

  // Function to initiate 10-minute cooldown
  const triggerCooldown = useCallback(() => {
    const until = Date.now() + COOLDOWN_DURATION_SECONDS * 1000;
    setCooldownUntil(until);
    setCooldownRemainingSeconds(COOLDOWN_DURATION_SECONDS);
    setGameState('idle');
    playSound('wrong');
    speakIndonesian('Belajar lagi, Yuk. 10 menit lagi kamu bisa main lagi.');
  }, []);

  // Jump / Flap action
  const handleJump = useCallback(() => {
    if (cooldownUntil !== null) return;

    if (gameState === 'idle') {
      startNewGame();
      return;
    }

    if (gameState === 'playing') {
      gameRef.current.charVy = gameRef.current.jumpForce;
      playSound('jump');
    }
  }, [gameState, cooldownUntil]);

  // Keyboard space / up arrow controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump]);

  // Start new game run
  const startNewGame = () => {
    if (cooldownUntil !== null) return;
    if (quotaRemainingSeconds <= 0) {
      triggerCooldown();
      return;
    }

    const g = gameRef.current;
    g.charY = 180;
    g.charVy = -2;
    g.charRotation = 0;
    g.apples = [];
    g.particles = [];
    g.floatingScores = [];
    g.frameCount = 0;
    g.currentScore = 0;
    g.currentSurvivalSec = 0;

    setApplesCollected(0);
    setSessionTimeSeconds(0);
    setGameState('playing');
    playSound('pop');
  };

  // Trigger game over
  const handleGameOver = useCallback((reason: string) => {
    setGameState('gameover');
    playSound('wrong');

    const finalScore = gameRef.current.currentScore;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      try {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, finalScore.toString());
      } catch (e) {
        console.warn(e);
      }
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
      });
      playSound('victory');
    }

    // Reward star if collected 5 or more apples in this run
    if (finalScore >= 5 && onEarnStar) {
      onEarnStar();
    }
  }, [highScore, onEarnStar]);

  // Setup Canvas & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI canvas size
    const width = 360;
    const height = 440;
    canvas.width = width;
    canvas.height = height;
    gameRef.current.canvasWidth = width;
    gameRef.current.canvasHeight = height;
    gameRef.current.groundY = height - 40;

    const activeChar = CHARACTERS.find((c) => c.id === selectedChar) || CHARACTERS[0];

    const render = () => {
      const g = gameRef.current;
      g.frameCount++;

      // 1. Clear background & draw sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#7dd3fc'); // sky blue
      skyGrad.addColorStop(0.65, '#bae6fd');
      skyGrad.addColorStop(1, '#fed7aa'); // warm horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw moving background clouds & rolling scenery
      const cloudSpeed = gameState === 'playing' ? 0.6 : 0.2;
      const cloudOffset1 = (g.frameCount * cloudSpeed) % (width + 120);
      const cloudOffset2 = (g.frameCount * cloudSpeed * 0.7 + 160) % (width + 120);

      const drawCloud = (cx: number, cy: number, scale = 1) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(cx, cy, 22 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 18 * scale, cy - 8 * scale, 18 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 38 * scale, cy, 20 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 18 * scale, cy + 8 * scale, 16 * scale, 0, Math.PI * 2);
        ctx.fill();
      };
      drawCloud(width - cloudOffset1 + 40, 55, 0.85);
      drawCloud(width - cloudOffset2 + 50, 105, 1.1);

      // Distant rolling green hills (no obstacles/hambatan)
      ctx.fillStyle = '#bbf7d0';
      ctx.beginPath();
      ctx.arc(width * 0.2, g.groundY + 40, 130, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(width * 0.78, g.groundY + 40, 150, Math.PI, 0);
      ctx.fill();

      // 3. Update physics if playing
      if (gameState === 'playing') {
        g.charVy += g.gravity;
        g.charY += g.charVy;

        // Rotation tilts up when jumping, tilts down when falling
        g.charRotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, g.charVy * 0.08));

        // Spawn Apples continuously (tanpa rintangan/tiang)
        if (g.frameCount % 50 === 0) {
          const randType = Math.random();

          if (randType < 0.18) {
            // Arc formation of 3 apples
            const startY = 110 + Math.random() * 120;
            const offsets = [25, 0, 25];
            offsets.forEach((offY, idx) => {
              g.apples.push({
                x: width + 20 + idx * 36,
                y: startY + offY,
                size: 16,
                collected: false,
                floatOffset: Math.random() * Math.PI * 2,
                isGolden: false,
                points: 1,
              });
            });
          } else if (randType < 0.32) {
            // Golden Bonus Apple (worth 3 points!)
            g.apples.push({
              x: width + 25,
              y: 80 + Math.random() * 180,
              size: 20,
              collected: false,
              floatOffset: Math.random() * Math.PI * 2,
              isGolden: true,
              points: 3,
            });
          } else {
            // Normal Red Apple at varying comfortable heights
            g.apples.push({
              x: width + 20,
              y: 70 + Math.random() * (g.groundY - 140),
              size: 16,
              collected: false,
              floatOffset: Math.random() * Math.PI * 2,
              isGolden: false,
              points: 1,
            });
          }
        }

        // Update & Move Apples
        for (let i = g.apples.length - 1; i >= 0; i--) {
          const apple = g.apples[i];
          apple.x -= g.speed;

          // Remove off-screen apples
          if (apple.x < -30) {
            g.apples.splice(i, 1);
            continue;
          }

          // Check Apple Collision with Character (Kumpulkan apel 🍎)
          const charX = 80;
          const dx = charX - apple.x;
          const dy = g.charY - apple.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 30 && !apple.collected) {
            apple.collected = true;
            g.currentScore += apple.points;
            setApplesCollected(g.currentScore);

            if (apple.isGolden) {
              playSound('victory');
            } else {
              playSound('apple');
            }

            // Emit sparkle particles
            const particleCount = apple.isGolden ? 14 : 8;
            for (let p = 0; p < particleCount; p++) {
              g.particles.push({
                x: apple.x,
                y: apple.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: apple.isGolden
                  ? ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff'][Math.floor(Math.random() * 4)]
                  : ['#ef4444', '#f59e0b', '#10b981', '#fbbf24'][Math.floor(Math.random() * 4)],
                size: Math.random() * 5 + 3,
                alpha: 1,
              });
            }

            // Emit Floating Score (+1 🍎 atau +3 ⭐)
            g.floatingScores.push({
              x: apple.x,
              y: apple.y - 12,
              text: apple.isGolden ? '+3 🌟' : '+1 🍎',
              color: apple.isGolden ? '#b45309' : '#dc2626',
              alpha: 1,
              vy: -1.6,
            });

            g.apples.splice(i, 1);
          }
        }

        // Check Ground Collision: Jika jatuh ke tanah maka gagal!
        if (g.charY + 16 >= g.groundY) {
          g.charY = g.groundY - 16;
          handleGameOver('Jatuh ke tanah!');
          return;
        }

        // Soft top ceiling boundary
        if (g.charY - 16 <= 0) {
          g.charY = 16;
          g.charVy = 0;
        }
      }

      // 4. Draw Apples (🍎 & Golden 🍏/⭐)
      g.apples.forEach((apple) => {
        const floatY = apple.y + Math.sin(g.frameCount * 0.1 + apple.floatOffset) * 5;

        ctx.save();
        ctx.translate(apple.x, floatY);

        if (apple.isGolden) {
          // Golden glowing ring & starburst
          ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.font = '24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🍏', 0, 2);
        } else {
          // Normal Red Apple glowing backdrop
          ctx.fillStyle = 'rgba(254, 240, 138, 0.65)';
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🍎', 0, 2);
        }

        ctx.restore();
      });

      // 6. Draw Particles (Apple collection sparkles)
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;

        if (p.alpha <= 0) {
          g.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 6. Draw Floating Score Numbers (+1 🍎, +3 🌟)
      for (let i = g.floatingScores.length - 1; i >= 0; i--) {
        const fs = g.floatingScores[i];
        fs.y += fs.vy;
        fs.alpha -= 0.025;

        if (fs.alpha <= 0) {
          g.floatingScores.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, fs.alpha);
        ctx.font = 'bold 15px Fredoka, sans-serif';
        ctx.fillStyle = fs.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 4;
        ctx.fillText(fs.text, fs.x, fs.y);
        ctx.restore();
      }

      // 7. Draw Character
      const charX = 80;
      const charY = gameState === 'idle' ? 180 + Math.sin(g.frameCount * 0.08) * 8 : g.charY;

      ctx.save();
      ctx.translate(charX, charY);
      ctx.rotate(gameState === 'playing' ? g.charRotation : 0);

      // Character shadow / aura
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();

      // Draw Emoji Character
      ctx.font = '34px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(activeChar.emoji, 0, 2);

      // Subtle wing flap indicator
      if (gameState === 'playing' && g.charVy < 0) {
        ctx.font = '14px sans-serif';
        ctx.fillText('💨', -18, 12);
      }

      ctx.restore();

      // 8. Draw Ground & Grass
      const groundGrad = ctx.createLinearGradient(0, g.groundY, 0, height);
      groundGrad.addColorStop(0, '#84cc16'); // bright grass green
      groundGrad.addColorStop(0.2, '#65a30d');
      groundGrad.addColorStop(1, '#78350f'); // warm dirt
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, g.groundY, width, height - g.groundY);

      // Grass blades line
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, g.groundY);
      ctx.lineTo(width, g.groundY);
      ctx.stroke();

      // Moving ground pattern
      const groundOffset = (g.frameCount * (gameState === 'playing' ? g.speed : 0.8)) % 24;
      ctx.fillStyle = '#a3e635';
      for (let x = -groundOffset; x < width + 24; x += 24) {
        ctx.beginPath();
        ctx.arc(x + 12, g.groundY + 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 9. In-game live HUD on canvas
      if (gameState === 'playing') {
        // Apples count badge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.roundRect(12, 12, 105, 36, 18);
        ctx.fill();
        ctx.strokeStyle = '#fecaca';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = 'bold 16px Fredoka, sans-serif';
        ctx.fillStyle = '#dc2626';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🍎 ${g.currentScore}`, 24, 30);

        // Survived time
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.roundRect(width - 110, 12, 98, 36, 18);
        ctx.fill();
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const mins = Math.floor(g.currentSurvivalSec / 60);
        const secs = g.currentSurvivalSec % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        ctx.font = 'bold 14px Fredoka, sans-serif';
        ctx.fillStyle = '#0369a1';
        ctx.textAlign = 'center';
        ctx.fillText(`⏱️ ${timeStr}`, width - 61, 30);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [gameState, selectedChar, handleGameOver]);

  // Format MM:SS helper
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isUnderCooldown = cooldownUntil !== null && cooldownRemainingSeconds > 0;
  const quotaPercent = Math.max(0, Math.min(100, (quotaRemainingSeconds / MAX_PLAY_QUOTA_SECONDS) * 100));

  return (
    <div className="flex flex-col gap-3.5 max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto pb-16 animate-in fade-in">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 rounded-3xl p-4 text-white shadow-md flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-100">
            <Gamepad2 className="w-4 h-4 text-yellow-300" />
            <span>Waktu Istirahat Ceria</span>
          </div>
          <h2 className="text-xl font-fredoka font-bold mt-0.5 leading-tight">
            Game Kumpulkan Apel 🍎
          </h2>
          <p className="text-xs text-white/90 mt-0.5 max-w-[280px]">
            Terbang santai, kumpulkan buah apel, dan ingat batas waktu bermain!
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onExit && (
            <button
              id="btn-exit-istirahat-banner"
              onClick={() => {
                playSound('click');
                onExit();
              }}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-fredoka font-bold text-xs flex items-center gap-1 border border-white/30 transition-all active:scale-95"
              title="Keluar dari Istirahat"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          )}
          <div className="text-4xl select-none opacity-90 pr-2">
            {CHARACTERS.find((c) => c.id === selectedChar)?.emoji || '🐦'}
          </div>
        </div>
      </div>

      {/* 2. Quota & Time Status Box */}
      <div className="bg-white rounded-3xl p-3.5 shadow-sm border border-emerald-100 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Kuota Bermain (Maks 15 Menit):</span>
          </div>
          <span
            className={`font-fredoka text-sm px-2 py-0.5 rounded-lg ${
              quotaRemainingSeconds > 180
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800 animate-pulse'
            }`}
          >
            {formatTime(quotaRemainingSeconds)} tersisa
          </span>
        </div>

        {/* Quota Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              quotaRemainingSeconds > 300
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                : quotaRemainingSeconds > 120
                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                : 'bg-gradient-to-r from-rose-500 to-red-600'
            }`}
            style={{ width: `${quotaPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>🏆 Rekor Apel: <strong className="text-amber-600">{highScore} Apel</strong></span>
          <span>Sesi Ini: <strong className="text-sky-600">{formatTime(sessionTimeSeconds)}</strong></span>
        </div>
      </div>

      {/* 3. CONDITIONAL: IF COOLDOWN IS ACTIVE (Wajib Istirahat 10 Menit) */}
      {isUnderCooldown ? (
        <div className="bg-white rounded-3xl p-6 shadow-md border-4 border-amber-400 flex flex-col items-center text-center gap-4 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center text-4xl shadow-inner border-2 border-amber-300">
            ⏰
          </div>

          <div className="flex flex-col gap-1.5 max-w-sm">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full mx-auto">
              Kuota 15 Menit Habis
            </span>
            {/* Exact Required Note / Catatan */}
            <h3 className="font-fredoka font-bold text-lg sm:text-xl text-slate-800 mt-2 text-rose-600 leading-snug">
              &ldquo;Belajar lagi, Yuk. 10 menit lagi kamu bisa main lagi.&rdquo;
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Matamu perlu beristirahat dari layar game. Ayo lanjutkan petualangan belajarmu sekarang!
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl px-6 py-3 shadow-xs">
            <span className="text-xs text-slate-600 font-bold block">
              Sisa Waktu Tunggu Istirahat:
            </span>
            <span className="font-fredoka font-bold text-3xl sm:text-4xl text-amber-600 tracking-wider">
              {formatTime(cooldownRemainingSeconds)}
            </span>
          </div>

          {/* Quick Shortcuts to return to learning */}
          <div className="w-full flex flex-col gap-2 mt-2">
            <span className="text-xs font-bold text-slate-600 text-left px-1">
              Pilih Pelajaran Seru Sekarang:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateTab('writing')}
                className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl text-left flex items-center gap-2.5 active:scale-95 transition-transform"
              >
                <Pencil className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="font-fredoka font-bold text-xs text-blue-900 truncate">
                  Latihan Menulis
                </span>
              </button>

              <button
                onClick={() => onNavigateTab('reading')}
                className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl text-left flex items-center gap-2.5 active:scale-95 transition-transform"
              >
                <BookOpen className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span className="font-fredoka font-bold text-xs text-rose-900 truncate">
                  Latihan Membaca
                </span>
              </button>

              <button
                onClick={() => onNavigateTab('math')}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-left flex items-center gap-2.5 active:scale-95 transition-transform"
              >
                <Calculator className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-fredoka font-bold text-xs text-emerald-900 truncate">
                  Matematika Dasar
                </span>
              </button>

              <button
                onClick={() => onNavigateTab('quiz')}
                className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-left flex items-center gap-2.5 active:scale-95 transition-transform"
              >
                <Trophy className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="font-fredoka font-bold text-xs text-amber-900 truncate">
                  Kuis 200 Level
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 4. Character Selection Tabs (Burung, Dino, Kucing, Unicorn) */}
          <div className="bg-white rounded-3xl p-3.5 shadow-sm border border-slate-100 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-700 px-1">
              Pilih Karaktermu:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {CHARACTERS.map((char) => (
                <button
                  key={char.id}
                  disabled={gameState === 'playing'}
                  onClick={() => {
                    setSelectedChar(char.id);
                    playSound('pop');
                  }}
                  className={`p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                    selectedChar === char.id
                      ? 'bg-amber-50 border-amber-500 shadow-sm scale-105'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-90'
                  } ${gameState === 'playing' ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span className="text-2xl">{char.emoji}</span>
                  <span className="text-[10px] font-fredoka font-bold text-slate-700 truncate w-full text-center">
                    {char.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. The Canvas Game Screen */}
          <div className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-lg border-4 border-emerald-300 mx-auto w-full max-w-[360px] sm:max-w-[420px] md:max-w-[460px] aspect-[9/11] flex items-center justify-center select-none">
            <canvas
              ref={canvasRef}
              onClick={handleJump}
              onTouchStart={(e) => {
                e.preventDefault();
                handleJump();
              }}
              className="w-full h-full cursor-pointer touch-none block"
            />

            {/* Overlays on Canvas */}
            {/* IDLE / START OVERLAY */}
            {gameState === 'idle' && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl animate-bounce">
                  {CHARACTERS.find((c) => c.id === selectedChar)?.emoji || '🐦'}
                </div>

                <div>
                  <h3 className="font-fredoka font-bold text-xl drop-shadow-md">
                    Kumpulkan Apel Sebanyaknya!
                  </h3>
                  <p className="text-xs text-amber-100 mt-1 max-w-[250px]">
                    Ketuk layar agar karakter terbang melayang dan tangkap semua buah apel. Jaga agar tidak jatuh ke tanah!
                  </p>
                </div>

                <button
                  id="btn-start-flappy"
                  onClick={startNewGame}
                  className="py-3 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-fredoka font-bold text-base rounded-2xl shadow-lg active:scale-95 flex items-center gap-2 border-2 border-emerald-300"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Mulai Main</span>
                </button>
              </div>
            )}

            {/* GAME OVER / GAGAL OVERLAY */}
            {gameState === 'gameover' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white text-center gap-3 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-3xl bg-rose-500/80 border-2 border-rose-300 flex items-center justify-center text-3xl shadow-lg">
                  💥
                </div>

                <div>
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-widest">
                    Karakter Jatuh ke Tanah
                  </span>
                  <h3 className="font-fredoka font-bold text-2xl drop-shadow-md mt-0.5">
                    Permainan Selesai!
                  </h3>
                </div>

                {/* Score Summary Box */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 w-full max-w-[260px] border border-white/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="flex items-center gap-1 text-slate-200">
                      <Apple className="w-4 h-4 text-red-400" />
                      <span>Buah Apel:</span>
                    </span>
                    <strong className="font-fredoka text-lg text-yellow-300">
                      {applesCollected} Apel
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1 border-t border-white/10 pt-1.5">
                    <span className="flex items-center gap-1 text-slate-200">
                      <Clock className="w-4 h-4 text-sky-400" />
                      <span>Waktu Bertahan:</span>
                    </span>
                    <strong className="font-fredoka text-sm text-sky-200">
                      {formatTime(sessionTimeSeconds)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1 border-t border-white/10 pt-1.5">
                    <span className="flex items-center gap-1 text-slate-200">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Rekor Tertinggi:</span>
                    </span>
                    <strong className="font-fredoka text-sm text-amber-300">
                      {highScore} Apel
                    </strong>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2.5 w-full max-w-[260px]">
                  <button
                    id="btn-play-again"
                    onClick={startNewGame}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white font-fredoka font-bold text-sm rounded-xl shadow-md active:scale-95 flex items-center justify-center gap-1.5 border border-emerald-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Main Lagi</span>
                  </button>

                  <button
                    id="btn-back-learning"
                    onClick={() => {
                      if (onExit) onExit();
                      else onNavigateTab('home');
                    }}
                    className="flex-1 py-2.5 bg-white/20 hover:bg-white/30 text-white font-fredoka font-bold text-sm rounded-xl shadow-md active:scale-95 flex items-center justify-center gap-1.5 border border-white/30"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Belajar</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 6. Friendly Tips for Parents & Kids */}
          <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Coffee className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Aturan Istirahat Sehat:</span>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                Bermain game maksimal 15 menit. Setelah itu istirahat 10 menit untuk menjaga kesehatan mata anak dan kembali bersemangat belajar membaca, menulis, atau berhitung!
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
