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
  Play,
  ChevronRight,
  Coffee,
  LogOut,
  X,
  Maximize2,
  Minimize2,
  Zap,
  CheckCircle2,
  Users
} from 'lucide-react';
import SchoolItems3DGame from './SchoolItems3DGame';

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
  // Navigation between Istirahat menu and games
  const [activeGame, setActiveGame] = useState<'menu' | 'apple' | 'school3d'>('menu');

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

  // Apple Game execution state: character_select -> playing -> gameover
  const [gameState, setGameState] = useState<'character_select' | 'playing' | 'gameover'>('character_select');
  const [applesCollected, setApplesCollected] = useState<number>(0);
  const [sessionTimeSeconds, setSessionTimeSeconds] = useState<number>(0);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState<number>(0);
  const [speedBoostNotification, setSpeedBoostNotification] = useState<string | null>(null);
  const [isFullscreenApple, setIsFullscreenApple] = useState<boolean>(true);
  const [gameOverReason, setGameOverReason] = useState<string>('');
  const [newRecord, setNewRecord] = useState<boolean>(false);
  const [missBonus, setMissBonus] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Game internal physics & entities ref
  const gameRef = useRef({
    charY: 180,
    charVy: 0,
    gravity: 0.36,
    jumpForce: -6.4,
    canvasWidth: 420,
    canvasHeight: 520,
    apples: [] as CollectibleApple[],
    particles: [] as Particle[],
    floatingScores: [] as FloatingScore[],
    speed: 2.2,
    baseSpeed: 2.2,
    speedMultiplier: 1.0,
    frameCount: 0,
    charRotation: 0,
    groundY: 480,
    currentScore: 0,
    currentSurvivalSec: 0,
    consecutiveMissed: 0,
    missBonus: 0,
    monster: null as null | { x: number },
    // Frame-rate independent timing (dt = jumlah frame-60fps per tick)
    animTime: 0,
    spawnTimer: 0,
    cloudDist1: 0,
    cloudDist2: 160,
    groundDist: 0,
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
      setSessionTimeSeconds((prev) => {
        const nextTime = prev + 1;
        gameRef.current.currentSurvivalSec = nextTime;

        // TANTANGAN KECEPATAN: Tambah kecepatan 0.5x setiap 30 detik!
        if (nextTime > 0 && nextTime % 30 === 0) {
          const speedStep = Math.floor(nextTime / 30);
          const newMultiplier = 1.0 + speedStep * 0.5;
          gameRef.current.speedMultiplier = newMultiplier;
          gameRef.current.speed = gameRef.current.baseSpeed * (newMultiplier + gameRef.current.missBonus);

          playSound('star');
          const notice = `⚡ TANTANGAN NAIK! Kecepatan +0.5x (${newMultiplier.toFixed(1)}x)`;
          setSpeedBoostNotification(notice);
          setTimeout(() => {
            setSpeedBoostNotification((curr) => (curr === notice ? null : curr));
          }, 3000);
        }

        return nextTime;
      });

      setQuotaRemainingSeconds((prevQuota) => {
        const nextQuota = prevQuota - 1;
        if (nextQuota <= 0) {
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
    setGameState('character_select');
    setActiveGame('menu');
    playSound('wrong');
    speakIndonesian('Belajar lagi, Yuk. 10 menit lagi kamu bisa main lagi.');
  }, []);

  // Jump / Flap action
  const handleJump = useCallback(() => {
    if (cooldownUntil !== null) return;

    if (gameState === 'character_select') {
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
      if (activeGame === 'apple') {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
          e.preventDefault();
          handleJump();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump, activeGame]);

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
    g.speedMultiplier = 1.0;
    g.speed = g.baseSpeed;
    g.consecutiveMissed = 0;
    g.missBonus = 0;
    g.monster = null;
    g.animTime = 0;
    g.spawnTimer = 0;
    g.cloudDist1 = 0;
    g.cloudDist2 = 160;
    g.groundDist = 0;

    setApplesCollected(0);
    setSessionTimeSeconds(0);
    setSpeedBoostNotification(null);
    setGameOverReason('');
    setNewRecord(false);
    setMissBonus(0);
    setGameState('playing');
    playSound('pop');
  };

  // Trigger game over
  const handleGameOver = useCallback((reason: string) => {
    setGameState('gameover');
    setGameOverReason(reason);
    playSound('wrong');

    const finalScore = gameRef.current.currentScore;
    const isRecord = finalScore > highScore;
    setNewRecord(isRecord && finalScore > 0);
    if (isRecord) {
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

    if (finalScore >= 5 && onEarnStar) {
      onEarnStar();
    }
  }, [highScore, onEarnStar]);

  // Setup Canvas & Game Loop for Apple Game
  useEffect(() => {
    if (activeGame !== 'apple') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 420;
    const height = 540;
    canvas.width = width;
    canvas.height = height;
    gameRef.current.canvasWidth = width;
    gameRef.current.canvasHeight = height;
    gameRef.current.groundY = height - 50;

    const activeChar = CHARACTERS.find((c) => c.id === selectedChar) || CHARACTERS[0];

    // Delta-time: samakan kecepatan di semua refresh-rate (60/90/120Hz).
    // dt = 1.0 berarti satu frame @60fps; dijepit maks 3 agar tidak lompat saat lag.
    let lastTime = performance.now();
    const render = (now: number) => {
      const g = gameRef.current;
      const dtMs = now - lastTime;
      lastTime = now;
      const dt = Math.max(0.1, Math.min(dtMs / 16.667, 3));
      g.animTime += dt / 60;
      g.frameCount++;

      // 1. Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#7dd3fc');
      skyGrad.addColorStop(0.65, '#bae6fd');
      skyGrad.addColorStop(1, '#fed7aa');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Moving clouds (berbasis jarak tempuh agar konsisten di semua fps)
      const cloudSpeed = (gameState === 'playing' ? 0.6 : 0.2) * g.speedMultiplier;
      g.cloudDist1 = (g.cloudDist1 + cloudSpeed * dt) % (width + 120);
      g.cloudDist2 = (g.cloudDist2 + cloudSpeed * 0.7 * dt) % (width + 120);
      const cloudOffset1 = g.cloudDist1;
      const cloudOffset2 = g.cloudDist2;

      const drawCloud = (cx: number, cy: number, scale = 1) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(cx, cy, 22 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 18 * scale, cy - 8 * scale, 18 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 38 * scale, cy, 20 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 18 * scale, cy + 8 * scale, 16 * scale, 0, Math.PI * 2);
        ctx.fill();
      };
      drawCloud(width - cloudOffset1 + 40, 55, 0.9);
      drawCloud(width - cloudOffset2 + 50, 115, 1.15);

      // Distant rolling green hills
      ctx.fillStyle = '#bbf7d0';
      ctx.beginPath();
      ctx.arc(width * 0.2, g.groundY + 40, 150, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(width * 0.78, g.groundY + 40, 170, Math.PI, 0);
      ctx.fill();

      // 3. Update physics if playing
      if (gameState === 'playing') {
        g.charVy += g.gravity * dt;
        g.charY += g.charVy * dt;
        g.charRotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, g.charVy * 0.08));

        // Spawn Apples (timer berbasis dt, bukan jumlah frame)
        const spawnInterval = Math.max(20, Math.round(48 / Math.sqrt(g.speedMultiplier)));
        g.spawnTimer += dt;
        if (g.spawnTimer >= spawnInterval) {
          g.spawnTimer = 0;
          const randType = Math.random();

          if (randType < 0.2) {
            const startY = 110 + Math.random() * 140;
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
          } else if (randType < 0.35) {
            g.apples.push({
              x: width + 25,
              y: 80 + Math.random() * 200,
              size: 20,
              collected: false,
              floatOffset: Math.random() * Math.PI * 2,
              isGolden: true,
              points: 3,
            });
          } else {
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
          apple.x -= g.speed * dt;

          if (apple.x < -30) {
            g.apples.splice(i, 1);
            // TANTANGAN LEWAT: apel terlewat berturut-turut
            g.consecutiveMissed += 1;
            if (g.consecutiveMissed === 5) {
              g.missBonus += 0.5;
              g.speed = g.baseSpeed * (g.speedMultiplier + g.missBonus);
              setMissBonus(g.missBonus);
              playSound('star');
              const notice = `⚠️ 5 apel terlewat! Kecepatan +0.5x`;
              setSpeedBoostNotification(notice);
              setTimeout(() => {
                setSpeedBoostNotification((curr) => (curr === notice ? null : curr));
              }, 3000);
            } else if (g.consecutiveMissed === 10 && !g.monster) {
              g.monster = { x: width + 40 };
              playSound('wrong');
              const notice = `👹 Monster datang! Jangan sampai tertangkap!`;
              setSpeedBoostNotification(notice);
              setTimeout(() => {
                setSpeedBoostNotification((curr) => (curr === notice ? null : curr));
              }, 3000);
            }
            continue;
          }

          const charX = 85;
          const dx = charX - apple.x;
          const dy = g.charY - apple.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 32 && !apple.collected) {
            apple.collected = true;
            g.currentScore += apple.points;
            g.consecutiveMissed = 0;
            setApplesCollected(g.currentScore);

            if (apple.isGolden) {
              playSound('victory');
            } else {
              playSound('apple');
            }

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

        // Monster chase (muncul setelah 10 apel terlewat berturut-turut)
        if (g.monster) {
          g.monster.x -= (g.speed * 1.3 + 0.8) * dt;
          const charX = 85;
          if (Math.abs(g.monster.x - charX) < 30) {
            handleGameOver('Diserang monster! 👹');
            return;
          }
        }

        // Ground Collision
        if (g.charY + 18 >= g.groundY) {
          g.charY = g.groundY - 18;
          handleGameOver('Jatuh ke tanah!');
          return;
        }

        // Ceiling boundary
        if (g.charY - 18 <= 0) {
          g.charY = 18;
          g.charVy = 0;
        }
      }

      // 4. Draw Apples
      g.apples.forEach((apple) => {
        const floatY = apple.y + Math.sin(g.animTime * 6 + apple.floatOffset) * 5;

        ctx.save();
        ctx.translate(apple.x, floatY);

        if (apple.isGolden) {
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

      // 4b. Draw Monster (mengejar setelah 10 apel terlewat)
      if (g.monster) {
        const mx = g.monster.x;
        const my = g.charY - 10 + Math.sin(g.animTime * 18) * 6;
        ctx.save();
        ctx.translate(mx, my);
        ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👹', 0, 2);
        ctx.restore();
      }

      // 5. Draw Particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= 0.025 * dt;

        if (p.alpha <= 0) {
          g.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 6. Draw Floating Score Text
      for (let i = g.floatingScores.length - 1; i >= 0; i--) {
        const fs = g.floatingScores[i];
        fs.y += fs.vy * dt;
        fs.alpha -= 0.025 * dt;

        if (fs.alpha <= 0) {
          g.floatingScores.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = fs.alpha;
        ctx.fillStyle = fs.color;
        ctx.font = 'bold 16px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(fs.text, fs.x, fs.y);
        ctx.restore();
      }

      // 7. Draw Character (dengan animasi terbang: kepak sayap + melayang)
      const charX = 85;
      const flyBob = gameState === 'playing' ? Math.sin(g.animTime * 15) * 4 : 0;
      const charDrawY = gameState === 'playing' ? g.charY + flyBob : 180 + Math.sin(g.animTime * 3) * 12;

      ctx.save();
      ctx.translate(charX, charDrawY);
      ctx.rotate(g.charRotation);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      // Sayap mengepak (flap mengikuti waktu agar konsisten di semua fps)
      const flap = Math.sin(g.animTime * 36) * 0.5;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.lineWidth = 1.5;
      // Sayap kiri
      ctx.save();
      ctx.translate(-14, -4);
      ctx.rotate(-0.5 - flap);
      ctx.beginPath();
      ctx.ellipse(-10, 0, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // Sayap kanan
      ctx.save();
      ctx.translate(14, -4);
      ctx.rotate(0.5 + flap);
      ctx.beginPath();
      ctx.ellipse(10, 0, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.restore();

      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(activeChar.emoji, 0, 2);

      if (g.speedMultiplier > 1.0 && gameState === 'playing') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-20, -6);
        ctx.lineTo(-38 - (g.speedMultiplier - 1) * 15, -6);
        ctx.moveTo(-18, 6);
        ctx.lineTo(-34 - (g.speedMultiplier - 1) * 15, 6);
        ctx.stroke();
      }

      ctx.restore();

      // 8. Draw Ground & Grass
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, g.groundY, width, height - g.groundY);

      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, g.groundY, width, 8);

      g.groundDist = (g.groundDist + g.speed * dt) % 40;
      const groundOffset = g.groundDist;
      ctx.fillStyle = '#16a34a';
      for (let gx = -groundOffset; gx < width + 40; gx += 40) {
        ctx.beginPath();
        ctx.arc(gx + 12, g.groundY + 12, 4, 0, Math.PI * 2);
        ctx.arc(gx + 24, g.groundY + 18, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 9. In-Canvas Top Status Badges
      if (gameState === 'playing') {
        // Score Badge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.roundRect(14, 14, 115, 38, 19);
        ctx.fill();
        ctx.strokeStyle = '#fecaca';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = 'bold 16px Fredoka, sans-serif';
        ctx.fillStyle = '#dc2626';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🍎 ${g.currentScore}`, 26, 33);

        // Speed Multiplier Badge (Every 30s)
        ctx.fillStyle = 'rgba(254, 240, 138, 0.95)';
        ctx.beginPath();
        ctx.roundRect(138, 14, 115, 38, 19);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = 'bold 13px Fredoka, sans-serif';
        ctx.fillStyle = '#b45309';
        ctx.textAlign = 'center';
        ctx.fillText(`⚡ ${(g.speedMultiplier + g.missBonus).toFixed(1)}x Cepat`, 195, 33);

        // Survived time
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.roundRect(width - 110, 14, 96, 38, 19);
        ctx.fill();
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const mins = Math.floor(g.currentSurvivalSec / 60);
        const secs = g.currentSurvivalSec % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        ctx.font = 'bold 13px Fredoka, sans-serif';
        ctx.fillStyle = '#0369a1';
        ctx.textAlign = 'center';
        ctx.fillText(`⏱️ ${timeStr}`, width - 62, 33);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [activeGame, gameState, selectedChar, handleGameOver]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isUnderCooldown = cooldownUntil !== null && cooldownRemainingSeconds > 0;
  const quotaPercent = Math.max(0, Math.min(100, (quotaRemainingSeconds / MAX_PLAY_QUOTA_SECONDS) * 100));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreenApple(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreenApple(false);
    }
  };

  // IF SCHOOL 3D GAME IS ACTIVE
  if (activeGame === 'school3d') {
    return (
      <SchoolItems3DGame
        onClose={() => setActiveGame('menu')}
        onEarnStar={onEarnStar}
      />
    );
  }

  // IF APPLE GAME IS ACTIVE (FULLSCREEN MODE)
  if (activeGame === 'apple') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between select-none overflow-hidden text-white font-sans">
        {/* Fullscreen Top Navigation Bar */}
        <div className="relative z-30 px-3 py-2 bg-slate-900/85   border-b border-white/10 flex items-center justify-between safe-top">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-400 flex items-center justify-center text-lg">
              🍎
            </div>
            <div>
              <h1 className="font-fredoka font-bold text-sm sm:text-base leading-tight text-white flex items-center gap-1.5">
                <span>Game Kumpulkan Apel</span>
                <span className="text-[10px] bg-amber-500/20 text-yellow-300 font-sans px-1.5 py-0.5 rounded border border-amber-500/30">
                  Layar Penuh
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Kecepatan game meningkat +0.5x setiap 30 detik!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Multiplier Live Pill (Every 30 seconds) */}
            <div className="bg-amber-500/20 border border-amber-400/40 px-2.5 py-1 rounded-xl flex items-center gap-1 text-yellow-300 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>{(1.0 + Math.floor(sessionTimeSeconds / 30) * 0.5 + missBonus).toFixed(1)}x</span>
            </div>

            {/* Quota Remaining */}
            <div className="bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-1 rounded-xl flex items-center gap-1 text-emerald-300 text-xs font-bold hidden sm:flex">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(quotaRemainingSeconds)}</span>
            </div>

            {/* Fullscreen native trigger */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreenApple ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close / Return to Menu */}
            <button
              onClick={() => {
                playSound('click');
                setGameState('character_select');
                setActiveGame('menu');
              }}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-400/30 transition-colors"
              title="Keluar ke Menu Istirahat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Speed Upgrade Floating Banner */}
        {speedBoostNotification && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-2xl border-2 border-yellow-200 font-fredoka font-bold text-sm flex items-center gap-2 animate-bounce">
            <Zap className="w-5 h-5 text-yellow-100" />
            <span>{speedBoostNotification}</span>
          </div>
        )}

        {/* Apple Game Canvas Center Viewport */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center bg-gradient-to-b from-sky-950 via-slate-900 to-slate-950 p-2 overflow-hidden">
          {/* 1. CHARACTER SELECTION FIRST (WAJIB PILIH KARAKTER DULU) */}
          {gameState === 'character_select' && (
            <div className="absolute inset-0 z-40 bg-gradient-to-b from-slate-900/95 via-sky-950/95 to-slate-900/95   flex flex-col items-center justify-center p-4 overflow-y-auto">
              <div className="max-w-md w-full bg-slate-800/90 border border-white/20 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-center my-auto animate-in zoom-in-95">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                    Pilih Karakter Dulu 🌟
                  </span>
                  <h2 className="font-fredoka font-bold text-2xl text-white mt-2">
                    Kumpulkan Apel Ceria 🍎
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Pilih karakter favoritmu untuk terbang mengumpulkan buah apel merah dan emas!
                  </p>
                </div>

                {/* 4 Characters Cards */}
                <div className="grid grid-cols-2 gap-2.5 text-left">
                  {CHARACTERS.map((char) => {
                    const isSelected = selectedChar === char.id;
                    return (
                      <button
                        key={char.id}
                        onClick={() => {
                          setSelectedChar(char.id);
                          playSound('pop');
                        }}
                        className={`p-3 rounded-2xl border-2 transition-all flex flex-col gap-1.5 text-left active:scale-95 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-3xl">{char.emoji}</span>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                        </div>
                        <div>
                          <div className="font-fredoka font-bold text-sm text-white">{char.name}</div>
                          <div className="text-[10px] text-slate-300">{char.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Challenge Info Card */}
                <div className="bg-slate-900/70 border border-amber-400/30 rounded-2xl p-3 text-left flex items-start gap-2.5 text-[11px] text-amber-200">
                  <Zap className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-yellow-300">Tantangan Seru:</span>
                    <p className="text-slate-300 mt-0.5 leading-snug">
                      Setiap <strong>30 detik</strong> kecepatan +0.5x. Lewati 5 apel berturut-turut = +0.5x! Awas: lewati 10 apel = monster 👹 datang!
                    </p>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={startNewGame}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-white font-fredoka font-bold text-base rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all border border-emerald-300"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Mulai Main (Layar Penuh)</span>
                </button>
              </div>
            </div>
          )}

          {/* Canvas Box */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-400/60 max-w-[420px] w-full aspect-[7/9] flex items-center justify-center bg-slate-900 select-none">
            <canvas
              ref={canvasRef}
              onClick={handleJump}
              onTouchStart={(e) => {
                e.preventDefault();
                handleJump();
              }}
              className="w-full h-full cursor-pointer touch-none block"
            />

            {/* GAME OVER OVERLAY */}
            {gameState === 'gameover' && (
              <div className="absolute inset-0 bg-black/75   flex flex-col items-center justify-center p-4 text-white text-center gap-3 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-3xl bg-rose-500/80 border-2 border-rose-300 flex items-center justify-center text-3xl shadow-lg">
                  💥
                </div>

                <div>
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-widest">
                    {gameOverReason || 'Permainan Selesai'}
                  </span>
                  <h3 className="font-fredoka font-bold text-2xl drop-shadow-md mt-0.5">
                    Permainan Selesai!
                  </h3>
                  {newRecord && (
                    <span className="inline-block mt-1.5 text-xs font-fredoka font-bold text-amber-950 bg-gradient-to-r from-amber-300 to-yellow-400 px-3 py-1 rounded-full animate-bounce">
                      🎉 Rekor Baru!
                    </span>
                  )}
                </div>

                {/* Score Summary Box */}
                <div className="bg-white/10   rounded-2xl p-3 w-full max-w-[280px] border border-white/20 flex flex-col gap-2">
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
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Kecepatan Tertinggi:</span>
                    </span>
                    <strong className="font-fredoka text-sm text-amber-300">
                      {(1.0 + Math.floor(sessionTimeSeconds / 30) * 0.5 + missBonus).toFixed(1)}x
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1 border-t border-white/10 pt-1.5">
                    <span className="flex items-center gap-1 text-slate-200">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Rekor Terbaik:</span>
                    </span>
                    <strong className="font-fredoka text-sm text-amber-300">
                      {highScore} Apel
                    </strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 w-full max-w-[280px]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={startNewGame}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-fredoka font-bold text-sm rounded-xl shadow-md active:scale-95 flex items-center justify-center gap-1.5 border border-emerald-300"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Main Lagi</span>
                    </button>

                    <button
                      onClick={() => setGameState('character_select')}
                      className="flex-1 py-2.5 bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 font-fredoka font-bold text-sm rounded-xl border border-amber-400/40 active:scale-95 flex items-center justify-center gap-1"
                    >
                      <Users className="w-4 h-4" />
                      <span>Ganti Tokoh</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      playSound('click');
                      setGameState('character_select');
                      setActiveGame('menu');
                    }}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold rounded-xl border border-white/10"
                  >
                    Kembali ke Menu Game
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Screen Tap Instruction */}
        <div className="py-2 text-center text-xs text-slate-400 bg-slate-900/80 border-t border-white/10">
          💡 Ketuk layar atau tekan tombol <strong>Spasi</strong> untuk melompat terbang.
        </div>
      </div>
    );
  }

  // DEFAULT VIEW: MENU ISTIRAHAT
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
            Pilih Game Istirahat 🎮
          </h2>
          <p className="text-xs text-white/90 mt-0.5 max-w-[280px]">
            Bermain seru sejenak untuk menyegarkan pikiran sebelum belajar lagi!
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
            🎈
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

      {/* 3. CONDITIONAL: IF COOLDOWN IS ACTIVE */}
      {isUnderCooldown ? (
        <div className="bg-white rounded-3xl p-6 shadow-md border-4 border-amber-400 flex flex-col items-center text-center gap-4 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center text-4xl shadow-inner border-2 border-amber-300">
            ⏰
          </div>

          <div className="flex flex-col gap-1.5 max-w-sm">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full mx-auto">
              Kuota 15 Menit Habis
            </span>
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

          {/* Quick Shortcuts */}
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
          {/* 4. GAME SELECTION CARDS */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-700 px-1">
              Pilih Game Favoritmu (Otomatis Layar Penuh):
            </span>

            {/* GAME 1: Game Apel (Pilih karakter dulu, lalu +0.5x kecepatan per 30 detik) */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border-2 border-emerald-200 hover:border-emerald-400 transition-all flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-4xl shadow-md flex-shrink-0">
                🍎
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    2D Refleks & Apel
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>+0.5x Tiap 30 Detik</span>
                  </span>
                </div>
                <h3 className="font-fredoka font-bold text-lg text-slate-800 mt-1">
                  Game Kumpulkan Apel
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih karakter terlebih dahulu, lalu terbang kumpulkan apel. Setiap 30 detik kecepatan bertambah +0.5x agar semakin seru dan menantang!
                </p>
              </div>

              <button
                onClick={() => {
                  playSound('click');
                  setActiveGame('apple');
                  setGameState('character_select');
                }}
                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-white font-fredoka font-bold text-sm rounded-2xl shadow-md active:scale-95 flex items-center justify-center gap-2 border border-emerald-300"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Main (Fullscreen)</span>
              </button>
            </div>

            {/* GAME 2: Kumpulkan barang sekolah (3D Open World) */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border-2 border-sky-200 hover:border-sky-400 transition-all flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-4xl shadow-md flex-shrink-0">
                🎒
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                    3D Open World
                  </span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>Misi 60 Detik</span>
                  </span>
                </div>
                <h3 className="font-fredoka font-bold text-lg text-slate-800 mt-1">
                  Kumpulkan barang sekolah
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Karakter & barang 3D realistis, kamera overhead sudut atas, dilengkapi Peta Radar sudut kiri atas untuk memantau posisi dan lokasi Meja Guru.
                </p>
              </div>

              <button
                onClick={() => {
                  playSound('click');
                  setActiveGame('school3d');
                }}
                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 text-white font-fredoka font-bold text-sm rounded-2xl shadow-md active:scale-95 flex items-center justify-center gap-2 border border-sky-300"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Main (Fullscreen 3D)</span>
              </button>
            </div>
          </div>

          {/* 5. Friendly Tips */}
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
