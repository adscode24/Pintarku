import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Capacitor } from '@capacitor/core';
import { playSound, speakIndonesian } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Maximize2,
  Minimize2,
  X,
  Clock,
  Sparkles,
  Trophy,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Backpack,
  Compass,
  Trash2,
  Hand
} from 'lucide-react';

interface SchoolItems3DGameProps {
  onClose: () => void;
  onEarnStar?: () => void;
}

export type Character3DId = 'budi' | 'siti' | 'robo' | 'kancil';

interface Character3DOption {
  id: Character3DId;
  name: string;
  role: string;
  emoji: string;
  shirtColor: number;
  pantsColor: number;
  hairColor: number;
  accessory: string;
  description: string;
}

const CHARACTERS_3D: Character3DOption[] = [
  {
    id: 'budi',
    name: 'Budi Juara',
    role: 'Siswa SD Merah Putih',
    emoji: '👦',
    shirtColor: 0xffffff,
    pantsColor: 0xbe123c,
    hairColor: 0x18181b,
    accessory: 'Topi SD Merah Putih & Dasi',
    description: 'Seragam lengkap SD dengan topi merah putih dan dasi rapi.',
  },
  {
    id: 'siti',
    name: 'Siti Cerdas',
    role: 'Siswi SD Merah Putih',
    emoji: '👧',
    shirtColor: 0xffffff,
    pantsColor: 0xbe123c,
    hairColor: 0x27272a,
    accessory: 'Pita Rambut Merah & Dasi',
    description: 'Rambut kuncir dua cantik dengan pita merah dan rok sekolah.',
  },
  {
    id: 'robo',
    name: 'Robo-KID',
    role: 'Robot Penjaga Sekolah',
    emoji: '🤖',
    shirtColor: 0x0284c7,
    pantsColor: 0x0f172a,
    hairColor: 0x38bdf8,
    accessory: 'Visor Neon & Antena Radar',
    description: 'Robot pintar dengan visor sensor bercahaya dan radar presisi.',
  },
  {
    id: 'kancil',
    name: 'Kancil Cerdik',
    role: 'Pramuka Siaga',
    emoji: '🦊',
    shirtColor: 0xd97706,
    pantsColor: 0x78350f,
    hairColor: 0xf59e0b,
    accessory: 'Kacu Pramuka Merah Putih',
    description: 'Seragam pramuka lengkap dengan kacu leher merah putih lincah.',
  },
];

interface WorldItem {
  id: string;
  name: string;
  isSchoolItem: boolean;
  mesh: THREE.Group;
  x: number;
  z: number;
  collected: boolean;
  baseY: number;
  points: number;
  emoji: string;
  type: string;
  color: number;
  canPickupAfter?: number;
}

interface HeldItem {
  id: string;
  name: string;
  isSchoolItem: boolean;
  emoji: string;
  type: string;
  color: number;
}

// Tree and obstacle locations for physical collision detection
const TREE_OBSTACLES = [
  { x: -16, z: -10, radius: 1.1 },
  { x: 16, z: -10, radius: 1.1 },
  { x: -18, z: 5, radius: 1.1 },
  { x: 18, z: 5, radius: 1.1 },
  { x: -16, z: 20, radius: 1.1 },
  { x: 16, z: 20, radius: 1.1 },
  { x: -10, z: 26, radius: 1.1 },
  { x: 10, z: 26, radius: 1.1 },
  { x: -22, z: -18, radius: 1.1 },
  { x: 22, z: -18, radius: 1.1 },
  { x: 0, z: -10, radius: 0.5 }, // Flagpole
];

// Available item catalog for continuous spawning
const ITEM_CATALOG = [
  // School items (+10)
  { name: 'Buku Pelajaran', isSchool: true, emoji: '📚', color: 0x3b82f6, type: 'book' },
  { name: 'Pensil Warna', isSchool: true, emoji: '✏️', color: 0xf59e0b, type: 'pencil' },
  { name: 'Tas Ransel', isSchool: true, emoji: '🎒', color: 0x10b981, type: 'backpack' },
  { name: 'Penggaris Segitiga', isSchool: true, emoji: '📐', color: 0x38bdf8, type: 'ruler' },
  { name: 'Kotak Krayon', isSchool: true, emoji: '🖍️', color: 0xfacc15, type: 'crayon' },
  { name: 'Botol Minum', isSchool: true, emoji: '🧴', color: 0x06b6d4, type: 'bottle' },
  { name: 'Buku Catatan', isSchool: true, emoji: '📓', color: 0x6366f1, type: 'book' },
  { name: 'Kamus Cilik', isSchool: true, emoji: '📕', color: 0xef4444, type: 'book' },

  // Non-school items (-5)
  { name: 'Stik Game PS', isSchool: false, emoji: '🎮', color: 0x1e293b, type: 'gamepad' },
  { name: 'Burger Cepat Saji', isSchool: false, emoji: '🍔', color: 0xd97706, type: 'burger' },
  { name: 'Kaos Kaki Kotor', isSchool: false, emoji: '🧦', color: 0x64748b, type: 'sock' },
  { name: 'Skateboard Rusak', isSchool: false, emoji: '🛹', color: 0x0284c7, type: 'skateboard' },
  { name: 'Tulang Anjing', isSchool: false, emoji: '🦴', color: 0xf8fafc, type: 'bone' },
];

// 3D ITEM MESH BUILDERS (MODULE SCOPE)
function createDetailedBook(coverColor: number) {
  const group = new THREE.Group();
  const coverGeo = new THREE.BoxGeometry(0.85, 1.1, 0.22);
  const coverMat = new THREE.MeshLambertMaterial({ color: coverColor });
  const cover = new THREE.Mesh(coverGeo, coverMat);
  cover.castShadow = true;
  group.add(cover);

  const pagesGeo = new THREE.BoxGeometry(0.78, 1.02, 0.16);
  const pagesMat = new THREE.MeshLambertMaterial({ color: 0xfafafa });
  const pages = new THREE.Mesh(pagesGeo, pagesMat);
  pages.position.x = 0.04;
  group.add(pages);

  const ribbonGeo = new THREE.BoxGeometry(0.12, 0.4, 0.02);
  const ribbonMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.position.set(0.04, -0.6, 0.02);
  group.add(ribbon);

  return group;
}

function createDetailedPencil(leadColor: number) {
  const group = new THREE.Group();
  const bodyGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.3, 6);
  const bodyMat = new THREE.MeshLambertMaterial({ color: leadColor });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  const woodConeGeo = new THREE.ConeGeometry(0.1, 0.35, 6);
  const woodMat = new THREE.MeshLambertMaterial({ color: 0xfde68a });
  const woodCone = new THREE.Mesh(woodConeGeo, woodMat);
  woodCone.position.y = 0.82;
  group.add(woodCone);

  const tipGeo = new THREE.ConeGeometry(0.045, 0.14, 6);
  const tipMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.position.y = 0.94;
  group.add(tip);

  const ferruleGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.18, 12);
  const ferruleMat = new THREE.MeshLambertMaterial({ color: 0xd1d5db });
  const ferrule = new THREE.Mesh(ferruleGeo, ferruleMat);
  ferrule.position.y = -0.68;
  group.add(ferrule);

  const eraserGeo = new THREE.CylinderGeometry(0.098, 0.098, 0.22, 12);
  const eraserMat = new THREE.MeshLambertMaterial({ color: 0xf472b6 });
  const eraser = new THREE.Mesh(eraserGeo, eraserMat);
  eraser.position.y = -0.84;
  group.add(eraser);

  group.rotation.z = Math.PI / 6;
  return group;
}

function createDetailedBackpack(color: number) {
  const group = new THREE.Group();
  const mainGeo = new THREE.BoxGeometry(0.85, 1.1, 0.55);
  const mainMat = new THREE.MeshLambertMaterial({ color });
  const mainBag = new THREE.Mesh(mainGeo, mainMat);
  mainBag.castShadow = true;
  group.add(mainBag);

  const pouchGeo = new THREE.BoxGeometry(0.7, 0.65, 0.2);
  const pouchMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const pouch = new THREE.Mesh(pouchGeo, pouchMat);
  pouch.position.set(0, -0.15, 0.35);
  group.add(pouch);

  const handleGeo = new THREE.TorusGeometry(0.18, 0.04, 8, 16, Math.PI);
  const handleMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.set(0, 0.58, 0);
  group.add(handle);

  return group;
}

function createDetailedRuler() {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(1.3, 0);
  shape.lineTo(0, 1.3);
  shape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(0.25, 0.25);
  hole.lineTo(0.85, 0.25);
  hole.lineTo(0.25, 0.85);
  hole.closePath();
  shape.holes.push(hole);

  const extrudeSettings = { depth: 0.04, bevelEnabled: false };
  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const mat = new THREE.MeshLambertMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const ruler = new THREE.Mesh(geom, mat);
  ruler.position.set(-0.6, -0.6, 0);
  group.add(ruler);
  return group;
}

function createDetailedCrayonBox() {
  const group = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(0.8, 0.9, 0.35);
  const boxMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.castShadow = true;
  group.add(box);

  const crayonColors = [0xef4444, 0x3b82f6, 0x10b981, 0xa855f7];
  crayonColors.forEach((cc, idx) => {
    const crGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.35, 10);
    const crMat = new THREE.MeshLambertMaterial({ color: cc });
    const cr = new THREE.Mesh(crGeo, crMat);
    cr.position.set(-0.25 + idx * 0.16, 0.5, 0);
    group.add(cr);
  });

  return group;
}

function createDetailedBottle(color: number) {
  const group = new THREE.Group();
  const bottleGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.1, 16);
  const bottleMat = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.9 });
  const bottle = new THREE.Mesh(bottleGeo, bottleMat);
  bottle.castShadow = true;
  group.add(bottle);

  const capGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.28, 16);
  const capMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 0.65;
  group.add(cap);

  return group;
}

function createDetailedGamepad() {
  const group = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(1.2, 0.65, 0.25);
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  const dpadGeo = new THREE.BoxGeometry(0.26, 0.26, 0.08);
  const dpadMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
  const dpad = new THREE.Mesh(dpadGeo, dpadMat);
  dpad.position.set(-0.35, 0.05, 0.14);
  group.add(dpad);

  const buttonColors = [0xef4444, 0x3b82f6, 0x10b981, 0xfacc15];
  const buttonPositions = [
    [0.35, 0.16], [0.45, 0.06], [0.35, -0.04], [0.25, 0.06]
  ];
  buttonColors.forEach((col, idx) => {
    const btnGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 8);
    const btnMat = new THREE.MeshLambertMaterial({ color: col });
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(buttonPositions[idx][0], buttonPositions[idx][1], 0.15);
    group.add(btn);
  });

  return group;
}

function createDetailedBurger() {
  const group = new THREE.Group();
  const topBunGeo = new THREE.SphereGeometry(0.48, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const bunMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
  const topBun = new THREE.Mesh(topBunGeo, bunMat);
  topBun.position.y = 0.22;
  group.add(topBun);

  const lettuceGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.06, 16);
  const lettuceMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
  const lettuce = new THREE.Mesh(lettuceGeo, lettuceMat);
  lettuce.position.y = 0.16;
  group.add(lettuce);

  const cheeseGeo = new THREE.BoxGeometry(0.68, 0.04, 0.68);
  const cheeseMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
  const cheese = new THREE.Mesh(cheeseGeo, cheeseMat);
  cheese.rotation.y = Math.PI / 4;
  cheese.position.y = 0.09;
  group.add(cheese);

  const pattyGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.14, 16);
  const pattyMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
  const patty = new THREE.Mesh(pattyGeo, pattyMat);
  patty.position.y = 0.0;
  group.add(patty);

  const botBunGeo = new THREE.CylinderGeometry(0.45, 0.42, 0.18, 16);
  const botBun = new THREE.Mesh(botBunGeo, bunMat);
  botBun.position.y = -0.15;
  group.add(botBun);

  return group;
}

function createDetailedSkateboard() {
  const group = new THREE.Group();
  const deckGeo = new THREE.BoxGeometry(1.4, 0.06, 0.4);
  const deckMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  group.add(deck);

  const gripGeo = new THREE.BoxGeometry(1.36, 0.01, 0.36);
  const gripMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
  const grip = new THREE.Mesh(gripGeo, gripMat);
  grip.position.y = 0.035;
  group.add(grip);

  [-0.45, 0.45].forEach((axleX) => {
    const truckGeo = new THREE.BoxGeometry(0.08, 0.1, 0.36);
    const truckMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const truck = new THREE.Mesh(truckGeo, truckMat);
    truck.position.set(axleX, -0.08, 0);
    group.add(truck);

    [-0.18, 0.18].forEach((wheelZ) => {
      const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
      const wheelMat = new THREE.MeshLambertMaterial({ color: 0xf43f5e });
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(axleX, -0.13, wheelZ);
      group.add(wheel);
    });
  });

  return group;
}

function createDetailedBone() {
  const group = new THREE.Group();
  const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 12);
  const boneMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
  const shaft = new THREE.Mesh(shaftGeo, boneMat);
  shaft.rotation.z = Math.PI / 2;
  group.add(shaft);

  [-0.45, 0.45].forEach((bx) => {
    [-0.1, 0.1].forEach((bz) => {
      const knobGeo = new THREE.SphereGeometry(0.12, 10, 10);
      const knob = new THREE.Mesh(knobGeo, boneMat);
      knob.position.set(bx, 0, bz);
      group.add(knob);
    });
  });

  return group;
}

function createDetailedSock() {
  const group = new THREE.Group();
  const legGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.6, 12);
  const sockMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
  const leg = new THREE.Mesh(legGeo, sockMat);
  leg.position.y = 0.3;
  group.add(leg);

  const footGeo = new THREE.BoxGeometry(0.55, 0.22, 0.26);
  const foot = new THREE.Mesh(footGeo, sockMat);
  foot.position.set(0.16, 0.05, 0);
  group.add(foot);

  return group;
}

function buildItemMesh(type: string, color: number) {
  if (type === 'book') return createDetailedBook(color);
  if (type === 'pencil') return createDetailedPencil(color);
  if (type === 'backpack') return createDetailedBackpack(color);
  if (type === 'ruler') return createDetailedRuler();
  if (type === 'crayon') return createDetailedCrayonBox();
  if (type === 'bottle') return createDetailedBottle(color);
  if (type === 'gamepad') return createDetailedGamepad();
  if (type === 'burger') return createDetailedBurger();
  if (type === 'skateboard') return createDetailedSkateboard();
  if (type === 'bone') return createDetailedBone();
  return createDetailedSock();
}

export default function SchoolItems3DGame({ onClose, onEarnStar }: SchoolItems3DGameProps) {
  // Game stage
  const [selectedChar, setSelectedChar] = useState<Character3DId>('budi');
  const [gameStage, setGameStage] = useState<'character_select' | 'playing' | 'gameover'>('character_select');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [schoolItemsCount, setSchoolItemsCount] = useState<number>(0);
  const [wrongItemsCount, setWrongItemsCount] = useState<number>(0);
  const [heldItems, setHeldItems] = useState<HeldItem[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);
  const [distanceToDesk, setDistanceToDesk] = useState<number>(14);
  const [teacherGender, setTeacherGender] = useState<'male' | 'female'>('female');
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('digilearn_3d_highscore_v1') : null;
      const parsed = saved ? parseInt(saved, 10) : 0;
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  });
  const [newRecord, setNewRecord] = useState<boolean>(false);

  // Backpack Drawer Modal State
  const [isBagOpen, setIsBagOpen] = useState<boolean>(false);
  const isBagOpenRef = useRef<boolean>(false);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    isBagOpenRef.current = isBagOpen;
  }, [isBagOpen]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Canvas & Three.js refs
  const mountRef = useRef<HTMLDivElement | null>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const characterMeshRef = useRef<THREE.Group | null>(null);
  const leftLegRef = useRef<THREE.Group | null>(null);
  const rightLegRef = useRef<THREE.Group | null>(null);
  const leftArmRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const worldItemsRef = useRef<WorldItem[]>([]);
  const collectionRingsRef = useRef<THREE.Group | null>(null);
  const itemCounterRef = useRef<number>(20);
  const teacherMeshRef = useRef<THREE.Group | null>(null);
  const teacherJumpRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);

  // Movement & Jump physics state
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const joystickRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const playerPosRef = useRef<{
    x: number;
    y: number;
    z: number;
    vy: number;
    isGrounded: boolean;
    rotation: number;
    speed: number;
  }>({
    x: 0,
    y: 0,
    z: 14,
    vy: 0,
    isGrounded: true,
    rotation: Math.PI,
    speed: 0,
  });

  // Collection Zone position in world
  const COLLECTION_ZONE = { x: 0, z: 0, radius: 4.5 };

  // Toast notification helper
  const showToast = useCallback((text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 2400);
  }, []);

  // Jump trigger handler
  const handleJump = useCallback(() => {
    const player = playerPosRef.current;
    if (player.isGrounded && gameStage === 'playing') {
      player.vy = 8.5; // Upward impulse
      player.isGrounded = false;
      playSound('jump');
    }
  }, [gameStage]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'KeyB') {
        setIsBagOpen((prev) => !prev);
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJump]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Start 3D Game
  const handleStartGame = () => {
    setGameStage('playing');
    setTimeLeft(60);
    setScore(0);
    setSchoolItemsCount(0);
    setWrongItemsCount(0);
    setHeldItems([]);
    setIsBagOpen(false);
    setNewRecord(false);
    setTeacherGender(Math.random() > 0.5 ? 'male' : 'female');
    playerPosRef.current = {
      x: 0,
      y: 0,
      z: 14,
      vy: 0,
      isGrounded: true,
      rotation: Math.PI,
      speed: 0,
    };
    playSound('pop');
    speakIndonesian('Ayo dekati barang untuk memasukkannya ke tas! Bawa ke Meja Guru sebelum waktu habis!');
  };

  // 60-second Timer Loop
  useEffect(() => {
    if (gameStage !== 'playing') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishGame();
          return 0;
        }
        if (prev === 11) {
          playSound('star');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStage]);

  // Finish Game & Show Results
  const finishGame = useCallback(() => {
    setGameStage('gameover');
    setIsBagOpen(false);
    playSound('victory');
    const finalScore = scoreRef.current;
    setHighScore((prev) => {
      if (finalScore > prev) {
        try {
          window.localStorage.setItem('digilearn_3d_highscore_v1', String(finalScore));
        } catch {
          // ignore storage errors
        }
        setNewRecord(true);
        return finalScore;
      }
      return prev;
    });
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
    });
    if (onEarnStar) {
      onEarnStar();
    }
    speakIndonesian('Waktu habis! Kerja bagus mengumpulkan perlengkapan sekolah!');
  }, [onEarnStar]);

  // SPAWN A SPECIFIC ITEM ON THE GROUND (When discarded from backpack)
  const spawnSpecificItemInWorld = useCallback(
    (scene: THREE.Scene, itemInfo: HeldItem, x: number, z: number) => {
      const itemGroup = new THREE.Group();

      const auraMat = new THREE.MeshBasicMaterial({
        color: itemInfo.isSchoolItem ? 0x38bdf8 : 0xf87171,
        transparent: true,
        opacity: 0.45,
      });
      const aura = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 16), auraMat);
      aura.position.y = 0.05;
      itemGroup.add(aura);

      const meshObj = buildItemMesh(itemInfo.type, itemInfo.color);
      meshObj.position.y = 1.1;
      itemGroup.add(meshObj);

      itemGroup.position.set(x, 0, z);
      scene.add(itemGroup);

      worldItemsRef.current.push({
        id: `${itemInfo.id}-drop-${Date.now()}`,
        name: itemInfo.name,
        isSchoolItem: itemInfo.isSchoolItem,
        mesh: itemGroup,
        x,
        z,
        collected: false,
        baseY: 1.1,
        points: itemInfo.isSchoolItem ? 10 : -5,
        emoji: itemInfo.emoji,
        type: itemInfo.type,
        color: itemInfo.color,
        canPickupAfter: Date.now() + 6000,
      });
    },
    []
  );

  // DISCARD ITEM OUT OF BACKPACK
  const discardItemFromBag = useCallback(
    (itemToDiscard: HeldItem) => {
      setHeldItems((prev) => prev.filter((i) => i.id !== itemToDiscard.id));
      playSound('pop');
      showToast(`📤 Mengeluarkan ${itemToDiscard.name} dari tas!`, false);

      const scene = sceneRef.current;
      if (!scene) return;

      const player = playerPosRef.current;
      const angle = player.rotation;
      const dropDist = 3.0;
      const dropX = player.x + Math.sin(angle) * dropDist + (Math.random() - 0.5) * 0.6;
      const dropZ = player.z + Math.cos(angle) * dropDist + (Math.random() - 0.5) * 0.6;

      spawnSpecificItemInWorld(scene, itemToDiscard, dropX, dropZ);
    },
    [showToast, spawnSpecificItemInWorld]
  );

  // SPAWN A BRAND NEW RANDOM ITEM IN A FRESH AREA
  const spawnNewRandomItemInWorld = useCallback((scene: THREE.Scene) => {
    const randTemplate = ITEM_CATALOG[Math.floor(Math.random() * ITEM_CATALOG.length)];
    itemCounterRef.current += 1;
    const newId = `item-respawn-${itemCounterRef.current}-${Date.now()}`;

    // Pick random location avoiding teacher desk
    let x = (Math.random() - 0.5) * 44;
    let z = (Math.random() - 0.5) * 40;
    while (Math.hypot(x - COLLECTION_ZONE.x, z - COLLECTION_ZONE.z) < 6.0) {
      x = (Math.random() - 0.5) * 44;
      z = (Math.random() - 0.5) * 40;
    }

    const itemGroup = new THREE.Group();

    const auraMat = new THREE.MeshBasicMaterial({
      color: randTemplate.isSchool ? 0x38bdf8 : 0xf87171,
      transparent: true,
      opacity: 0.45,
    });
    const aura = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 16), auraMat);
    aura.position.y = 0.05;
    itemGroup.add(aura);

    const meshObj = buildItemMesh(randTemplate.type, randTemplate.color);
    meshObj.position.y = 1.1;
    itemGroup.add(meshObj);

    itemGroup.position.set(x, 0, z);
    scene.add(itemGroup);

    worldItemsRef.current.push({
      id: newId,
      name: randTemplate.name,
      isSchoolItem: randTemplate.isSchool,
      mesh: itemGroup,
      x,
      z,
      collected: false,
      baseY: 1.1,
      points: randTemplate.isSchool ? 10 : -5,
      emoji: randTemplate.emoji,
      type: randTemplate.type,
      color: randTemplate.color,
    });
  }, []);

  // REALISTIC HUMANOID CHARACTER BUILDER
  const createRealisticCharacter = (charOption: Character3DOption) => {
    const group = new THREE.Group();

    // Torso with School Uniform
    const torsoGroup = new THREE.Group();
    const shirtGeo = new THREE.BoxGeometry(0.85, 1.05, 0.5);
    const shirtMat = new THREE.MeshLambertMaterial({ color: charOption.shirtColor });
    const shirt = new THREE.Mesh(shirtGeo, shirtMat);
    shirt.position.y = 1.25;
    shirt.castShadow = true;
    torsoGroup.add(shirt);

    const collarGeo = new THREE.BoxGeometry(0.45, 0.12, 0.52);
    const collarMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 1.76, 0);
    torsoGroup.add(collar);

    if (charOption.id === 'budi' || charOption.id === 'siti') {
      const tieGeo = new THREE.BoxGeometry(0.12, 0.55, 0.04);
      const tieMat = new THREE.MeshLambertMaterial({ color: 0xbe123c });
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(0, 1.42, 0.27);
      torsoGroup.add(tie);

      const badgeGeo = new THREE.PlaneGeometry(0.12, 0.14);
      const badgeMat = new THREE.MeshBasicMaterial({ color: 0x1d4ed8, side: THREE.DoubleSide });
      const badge = new THREE.Mesh(badgeGeo, badgeMat);
      badge.position.set(0.24, 1.48, 0.26);
      torsoGroup.add(badge);
    } else if (charOption.id === 'kancil') {
      const kacuGeo = new THREE.ConeGeometry(0.24, 0.45, 3);
      const kacuMat = new THREE.MeshLambertMaterial({ color: 0xbe123c });
      const kacu = new THREE.Mesh(kacuGeo, kacuMat);
      kacu.rotation.z = Math.PI;
      kacu.position.set(0, 1.48, 0.27);
      torsoGroup.add(kacu);
    } else if (charOption.id === 'robo') {
      const coreGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.05, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.rotation.x = Math.PI / 2;
      core.position.set(0, 1.42, 0.27);
      torsoGroup.add(core);
    }

    const beltGeo = new THREE.BoxGeometry(0.88, 0.1, 0.52);
    const beltMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, 0.75, 0);
    torsoGroup.add(belt);

    const buckleGeo = new THREE.BoxGeometry(0.16, 0.12, 0.54);
    const buckleMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
    const buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, 0.75, 0);
    torsoGroup.add(buckle);

    const backpackGeo = new THREE.BoxGeometry(0.65, 0.78, 0.32);
    const backpackMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
    const backpack = new THREE.Mesh(backpackGeo, backpackMat);
    backpack.position.set(0, 1.3, -0.4);
    backpack.castShadow = true;
    torsoGroup.add(backpack);

    group.add(torsoGroup);

    // Realistic Head
    const headGroup = new THREE.Group();
    const skinColor = charOption.id === 'robo' ? 0x94a3b8 : 0xfed7aa;
    const headGeo = new THREE.SphereGeometry(0.42, 20, 20);
    const headMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.15;
    head.castShadow = true;
    headGroup.add(head);

    if (charOption.id !== 'robo') {
      [-0.14, 0.14].forEach((ex) => {
        const eyeWhiteGeo = new THREE.SphereGeometry(0.085, 12, 12);
        const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        eyeWhite.position.set(ex, 2.18, 0.36);
        headGroup.add(eyeWhite);

        const pupilGeo = new THREE.SphereGeometry(0.045, 10, 10);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const pupil = new THREE.Mesh(pupilGeo, pupilMat);
        pupil.position.set(ex, 2.18, 0.42);
        headGroup.add(pupil);
      });

      const mouthGeo = new THREE.TorusGeometry(0.09, 0.02, 8, 12, Math.PI);
      const mouthMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
      const mouth = new THREE.Mesh(mouthGeo, mouthMat);
      mouth.rotation.x = Math.PI;
      mouth.position.set(0, 2.05, 0.4);
      headGroup.add(mouth);
    } else {
      const visorGeo = new THREE.BoxGeometry(0.55, 0.18, 0.1);
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 2.18, 0.38);
      headGroup.add(visor);

      const antPoleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
      const antPoleMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
      const antPole = new THREE.Mesh(antPoleGeo, antPoleMat);
      antPole.position.set(0, 2.7, 0);
      headGroup.add(antPole);

      const antBulbGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const antBulbMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const antBulb = new THREE.Mesh(antBulbGeo, antBulbMat);
      antBulb.position.set(0, 2.88, 0);
      headGroup.add(antBulb);
    }

    if (charOption.id === 'budi') {
      const capDomeGeo = new THREE.SphereGeometry(0.44, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const capDomeMat = new THREE.MeshLambertMaterial({ color: 0xbe123c });
      const capDome = new THREE.Mesh(capDomeGeo, capDomeMat);
      capDome.position.y = 2.26;
      headGroup.add(capDome);

      const brimGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.04, 16, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
      const brim = new THREE.Mesh(brimGeo, capDomeMat);
      brim.position.set(0, 2.24, 0.18);
      headGroup.add(brim);

      const hairGeo = new THREE.BoxGeometry(0.65, 0.18, 0.15);
      const hairMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 2.32, 0.36);
      headGroup.add(hair);
    } else if (charOption.id === 'siti') {
      const hairDomeGeo = new THREE.SphereGeometry(0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.6);
      const hairMat = new THREE.MeshLambertMaterial({ color: 0x27272a });
      const hairDome = new THREE.Mesh(hairDomeGeo, hairMat);
      hairDome.position.y = 2.22;
      headGroup.add(hairDome);

      [-0.42, 0.42].forEach((px) => {
        const ptailGeo = new THREE.SphereGeometry(0.18, 12, 12);
        const ptail = new THREE.Mesh(ptailGeo, hairMat);
        ptail.position.set(px, 2.26, -0.05);
        headGroup.add(ptail);

        const ribGeo = new THREE.TorusGeometry(0.1, 0.03, 8, 12);
        const ribMat = new THREE.MeshLambertMaterial({ color: 0xbe123c });
        const rib = new THREE.Mesh(ribGeo, ribMat);
        rib.position.set(px, 2.36, -0.05);
        headGroup.add(rib);
      });
    } else if (charOption.id === 'kancil') {
      [-0.24, 0.24].forEach((ex) => {
        const earGeo = new THREE.ConeGeometry(0.16, 0.36, 10);
        const earMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
        const ear = new THREE.Mesh(earGeo, earMat);
        ear.position.set(ex, 2.65, 0);
        headGroup.add(ear);
      });
    }

    group.add(headGroup);

    // Arms
    const buildArm = (isLeft: boolean) => {
      const armGroup = new THREE.Group();
      const sleeveGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.42, 12);
      const sleeveMat = new THREE.MeshLambertMaterial({ color: charOption.shirtColor });
      const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
      sleeve.position.y = -0.15;
      sleeve.castShadow = true;
      armGroup.add(sleeve);

      const forearmGeo = new THREE.CylinderGeometry(0.11, 0.1, 0.4, 12);
      const forearmMat = new THREE.MeshLambertMaterial({ color: skinColor });
      const forearm = new THREE.Mesh(forearmGeo, forearmMat);
      forearm.position.y = -0.45;
      armGroup.add(forearm);

      const handGeo = new THREE.SphereGeometry(0.12, 10, 10);
      const hand = new THREE.Mesh(handGeo, forearmMat);
      hand.position.y = -0.7;
      armGroup.add(hand);

      armGroup.position.set(isLeft ? -0.55 : 0.55, 1.6, 0);
      return armGroup;
    };

    const leftArm = buildArm(true);
    const rightArm = buildArm(false);
    group.add(leftArm, rightArm);
    leftArmRef.current = leftArm;
    rightArmRef.current = rightArm;

    // Legs
    const buildLeg = (isLeft: boolean) => {
      const legGroup = new THREE.Group();
      const pantsGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.38, 12);
      const pantsMat = new THREE.MeshLambertMaterial({ color: charOption.pantsColor });
      const pants = new THREE.Mesh(pantsGeo, pantsMat);
      pants.position.y = -0.15;
      pants.castShadow = true;
      legGroup.add(pants);

      const kneeGeo = new THREE.CylinderGeometry(0.13, 0.12, 0.28, 12);
      const kneeMat = new THREE.MeshLambertMaterial({ color: skinColor });
      const knee = new THREE.Mesh(kneeGeo, kneeMat);
      knee.position.y = -0.42;
      legGroup.add(knee);

      const sockGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.22, 12);
      const sockMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const sock = new THREE.Mesh(sockGeo, sockMat);
      sock.position.y = -0.58;
      legGroup.add(sock);

      const shoeUpperGeo = new THREE.BoxGeometry(0.24, 0.16, 0.44);
      const shoeMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
      const shoeUpper = new THREE.Mesh(shoeUpperGeo, shoeMat);
      shoeUpper.position.set(0, -0.68, 0.08);
      shoeUpper.castShadow = true;
      legGroup.add(shoeUpper);

      const soleGeo = new THREE.BoxGeometry(0.26, 0.06, 0.46);
      const soleMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const sole = new THREE.Mesh(soleGeo, soleMat);
      sole.position.set(0, -0.74, 0.08);
      legGroup.add(sole);

      legGroup.position.set(isLeft ? -0.22 : 0.22, 0.72, 0);
      return legGroup;
    };

    const leftLeg = buildLeg(true);
    const rightLeg = buildLeg(false);
    group.add(leftLeg, rightLeg);
    leftLegRef.current = leftLeg;
    rightLegRef.current = rightLeg;

    return group;
  };

  // MINI-MAP 2D RADAR
  const drawMinimap = (player: { x: number; z: number; rotation: number }) => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const worldMinX = -26;
    const worldMaxX = 26;
    const worldMinZ = -24;
    const worldMaxZ = 28;

    const toMapX = (wx: number) => ((wx - worldMinX) / (worldMaxX - worldMinX)) * w;
    const toMapY = (wz: number) => ((wz - worldMinZ) / (worldMaxZ - worldMinZ)) * h;

    // Grass
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, 0, w, h);

    // Path
    const px1 = toMapX(-6);
    const px2 = toMapX(6);
    const py1 = toMapY(-22);
    const py2 = toMapY(26);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(px1, py1, px2 - px1, py2 - py1);

    // School Building
    const bx1 = toMapX(-14);
    const bx2 = toMapX(14);
    const by1 = toMapY(-24);
    const by2 = toMapY(-18);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(bx1, by1, bx2 - bx1, by2 - by1);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GEDUNG SEKOLAH', w / 2, by1 + 6.5);

    // Tree Obstacles plotted on Radar
    ctx.fillStyle = '#166534';
    TREE_OBSTACLES.forEach((t) => {
      ctx.beginPath();
      ctx.arc(toMapX(t.x), toMapY(t.z), 2.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Collection Zone (Meja Guru)
    const zoneMapX = toMapX(COLLECTION_ZONE.x);
    const zoneMapY = toMapY(COLLECTION_ZONE.z);
    const zoneRadius = (COLLECTION_ZONE.radius / (worldMaxX - worldMinX)) * w;

    const pulse = Math.sin(Date.now() * 0.006) * 1.5;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.beginPath();
    ctx.arc(zoneMapX, zoneMapY, Math.max(3, zoneRadius + pulse), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(zoneMapX, zoneMapY, zoneRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(zoneMapX, zoneMapY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MEJA GURU 🚩', zoneMapX, zoneMapY - 5);

    // Uncollected Items
    worldItemsRef.current.forEach((item) => {
      if (!item.collected) {
        const ix = toMapX(item.x);
        const iy = toMapY(item.z);
        ctx.fillStyle = item.isSchoolItem ? '#38bdf8' : '#f87171';
        ctx.beginPath();
        ctx.arc(ix, iy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Player Position & Direction
    const playerMapX = toMapX(player.x);
    const playerMapY = toMapY(player.z);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(playerMapX, playerMapY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(playerMapX, playerMapY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    const dirLength = 8;
    const arrowX = playerMapX + Math.sin(player.rotation) * dirLength;
    const arrowY = playerMapY + Math.cos(player.rotation) * dirLength;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playerMapX, playerMapY);
    ctx.lineTo(arrowX, arrowY);
    ctx.stroke();
  };

  // AUTOMATIC PROXIMITY PICKUP
  const handleAutoPickup = useCallback(
    (item: WorldItem) => {
      if (item.collected) return;
      if (item.canPickupAfter && Date.now() < item.canPickupAfter) return;
      item.collected = true;
      item.mesh.visible = false;

      const newHeld: HeldItem = {
        id: item.id,
        name: item.name,
        isSchoolItem: item.isSchoolItem,
        emoji: item.emoji,
        type: item.type,
        color: item.color,
      };

      setHeldItems((prev) => [...prev, newHeld]);
      teacherJumpRef.current = Date.now();

      if (item.isSchoolItem) {
        playSound('apple');
        showToast(`🎒 Masuk Tas: ${item.name} (${item.emoji})`, false);
      } else {
        playSound('wrong');
        showToast(`⚠️ Masuk Tas: ${item.name} (${item.emoji}) - Ini BUKAN barang sekolah!`, true);
      }

      // Schedule new items to spawn in new areas to keep world populated!
      if (sceneRef.current) {
        setTimeout(() => {
          if (sceneRef.current && gameStage === 'playing') {
            spawnNewRandomItemInWorld(sceneRef.current);
            spawnNewRandomItemInWorld(sceneRef.current);
          }
        }, 1200);
      }
    },
    [gameStage, showToast, spawnNewRandomItemInWorld]
  );

  // DEPOSIT ITEMS AT TEACHER'S DESK
  const handleDepositItems = useCallback(() => {
    if (heldItems.length === 0) return;

    let deltaScore = 0;
    let addedSchool = 0;
    let addedWrong = 0;

    heldItems.forEach((item) => {
      if (item.isSchoolItem) {
        deltaScore += 10;
        addedSchool += 1;
      } else {
        deltaScore -= 5;
        addedWrong += 1;
      }
    });

    setScore((prev) => Math.max(0, prev + deltaScore));
    setSchoolItemsCount((prev) => prev + addedSchool);
    setWrongItemsCount((prev) => prev + addedWrong);
    setHeldItems([]);

    if (addedSchool > 0 && addedWrong === 0) {
      playSound('victory');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      showToast(`🎉 Sukses setor ${addedSchool} barang sekolah ke Meja Guru! (+${deltaScore} Poin)`, false);
    } else if (addedWrong > 0) {
      playSound('wrong');
      showToast(`⚠️ Termasuk ${addedWrong} barang BUKAN sekolah! Nilai dikurangi (${deltaScore >= 0 ? `+${deltaScore}` : deltaScore} Poin)`, true);
    }
  }, [heldItems, showToast]);

  // CONTINUOUS ITEM SPAWNER LOOP (Keeps spawning items in new areas)
  useEffect(() => {
    if (gameStage !== 'playing') return;

    const spawnInterval = setInterval(() => {
      const scene = sceneRef.current;
      if (!scene) return;

      const activeUncollected = worldItemsRef.current.filter((i) => !i.collected).length;
      if (activeUncollected < 12) {
        spawnNewRandomItemInWorld(scene);
      }
    }, 2800);

    return () => clearInterval(spawnInterval);
  }, [gameStage, spawnNewRandomItemInWorld]);

  // Check if player is currently inside the Collection Zone
  const isInsideCollectionZone = () => {
    const player = playerPosRef.current;
    const dist = Math.hypot(player.x - COLLECTION_ZONE.x, player.z - COLLECTION_ZONE.z);
    return dist <= COLLECTION_ZONE.radius;
  };

  // Auto-deposit when player walks into collection zone
  useEffect(() => {
    if (gameStage !== 'playing' || heldItems.length === 0) return;

    const checkInterval = setInterval(() => {
      if (isInsideCollectionZone() && heldItems.length > 0) {
        handleDepositItems();
      }
    }, 450);

    return () => clearInterval(checkInterval);
  }, [gameStage, heldItems, handleDepositItems]);

  // Three.js Scene Setup & Render Loop
  useEffect(() => {
    if (gameStage !== 'playing') return;
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x7dd3fc);
    scene.fog = new THREE.FogExp2(0x7dd3fc, 0.012);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.15);
    dirLight.position.set(22, 38, 22);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 85;
    const d = 32;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x86efac });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Central Path
    const pathGeo = new THREE.PlaneGeometry(12, 50);
    const pathMat = new THREE.MeshLambertMaterial({ color: 0xfef3c7 });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.02;
    path.receiveShadow = true;
    scene.add(path);

    // School Building
    const schoolGroup = new THREE.Group();
    const schoolMat = new THREE.MeshLambertMaterial({ color: 0xffedd5 });
    const schoolWall = new THREE.Mesh(new THREE.BoxGeometry(28, 10, 8), schoolMat);
    schoolWall.position.set(0, 5, -22);
    schoolWall.castShadow = true;
    schoolWall.receiveShadow = true;
    schoolGroup.add(schoolWall);

    const roofMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(20, 4, 4), roofMat);
    roof.position.set(0, 12, -22);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.1, 1, 0.6);
    schoolGroup.add(roof);

    const doorMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
    const door = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 0.2), doorMat);
    door.position.set(0, 2.5, -17.9);
    schoolGroup.add(door);

    [-8, -4, 4, 8].forEach((wx) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 0.2), new THREE.MeshLambertMaterial({ color: 0x38bdf8 }));
      win.position.set(wx, 6, -17.9);
      schoolGroup.add(win);
    });
    scene.add(schoolGroup);

    // Flagpole
    const poleMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 10, 16), poleMat);
    pole.position.set(0, 5, -10);
    pole.castShadow = true;
    scene.add(pole);

    const flagGroup = new THREE.Group();
    const flagRed = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.6), new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide }));
    flagRed.position.set(0.9, 8.8, -10);
    const flagWhite = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    flagWhite.position.set(0.9, 8.2, -10);
    flagGroup.add(flagRed, flagWhite);
    scene.add(flagGroup);

    // Trees
    const createTree = (x: number, z: number) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 3.2, 12), new THREE.MeshLambertMaterial({ color: 0x78350f }));
      trunk.position.y = 1.6;
      trunk.castShadow = true;
      const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0, 1), new THREE.MeshLambertMaterial({ color: 0x15803d }));
      leaves.position.y = 3.8;
      leaves.castShadow = true;
      tree.add(trunk, leaves);
      tree.position.set(x, 0, z);
      scene.add(tree);
    };

    [
      [-16, -10], [16, -10],
      [-18, 5], [18, 5],
      [-16, 20], [16, 20],
      [-10, 26], [10, 26],
      [-22, -18], [22, -18],
    ].forEach(([tx, tz]) => createTree(tx, tz));

    // Collection Zone (Meja Guru Lingkaran Emas)
    const zoneGroup = new THREE.Group();
    const zoneFloorGeo = new THREE.CylinderGeometry(COLLECTION_ZONE.radius, COLLECTION_ZONE.radius, 0.1, 32);
    const zoneFloorMat = new THREE.MeshLambertMaterial({ color: 0xfef08a, transparent: true, opacity: 0.85 });
    const zoneFloor = new THREE.Mesh(zoneFloorGeo, zoneFloorMat);
    zoneFloor.position.set(COLLECTION_ZONE.x, 0.05, COLLECTION_ZONE.z);
    zoneFloor.receiveShadow = true;
    zoneGroup.add(zoneFloor);

    const ringsGroup = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(COLLECTION_ZONE.radius - 0.4, COLLECTION_ZONE.radius, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = 0.08;
    ringsGroup.add(ring1);
    zoneGroup.add(ringsGroup);
    collectionRingsRef.current = ringsGroup;

    // Meja Guru
    const deskMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.2), deskMat);
    desk.position.set(COLLECTION_ZONE.x, 0.6, COLLECTION_ZONE.z - 0.5);
    desk.castShadow = true;
    zoneGroup.add(desk);

    // Signpost
    const signMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2), signMat);
    signPole.position.set(COLLECTION_ZONE.x, 1.1, COLLECTION_ZONE.z + 1.2);
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.12), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
    signBoard.position.set(COLLECTION_ZONE.x, 2, COLLECTION_ZONE.z + 1.2);
    zoneGroup.add(signPole, signBoard);

    // Teacher character behind the desk (jumps with joy on pickup)
    const teacher = new THREE.Group();
    const teacherBodyMat = new THREE.MeshLambertMaterial({
      color: teacherGender === 'male' ? 0x1e40af : 0xec4899,
    });
    const teacherBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.5), teacherBodyMat);
    teacherBody.position.y = 1.1;
    teacherBody.castShadow = true;
    teacher.add(teacherBody);
    const teacherHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshLambertMaterial({ color: 0xfcd9b8 })
    );
    teacherHead.position.y = 2.05;
    teacherHead.castShadow = true;
    teacher.add(teacherHead);
    if (teacherGender === 'male') {
      const pants = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.6, 0.45),
        new THREE.MeshLambertMaterial({ color: 0x1e293b })
      );
      pants.position.y = 0.3;
      teacher.add(pants);
      const shortHair = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.2, 0.55),
        new THREE.MeshLambertMaterial({ color: 0x18181b })
      );
      shortHair.position.y = 2.38;
      teacher.add(shortHair);
    } else {
      const skirt = new THREE.Mesh(
        new THREE.ConeGeometry(0.55, 0.9, 12),
        new THREE.MeshLambertMaterial({ color: 0x9d174d })
      );
      skirt.position.y = 0.45;
      teacher.add(skirt);
      const longHair = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.9, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x3f3f46 })
      );
      longHair.position.set(0, 1.9, -0.3);
      teacher.add(longHair);
    }
    teacher.position.set(COLLECTION_ZONE.x, 0, COLLECTION_ZONE.z - 2.2);
    zoneGroup.add(teacher);
    teacherMeshRef.current = teacher;

    scene.add(zoneGroup);

    // 3D Character
    const charData = CHARACTERS_3D.find((c) => c.id === selectedChar) || CHARACTERS_3D[0];
    const characterGroup = createRealisticCharacter(charData);
    characterGroup.position.set(playerPosRef.current.x, 0, playerPosRef.current.z);
    scene.add(characterGroup);
    characterMeshRef.current = characterGroup;

    // Initial 24 Items across courtyard (doubled for denser world)
    const initialItems = Array.from({ length: 24 }, (_, i) => ITEM_CATALOG[i % ITEM_CATALOG.length]);
    const worldItems: WorldItem[] = [];
    const spawnPositions: [number, number][] = [
      [-10, 8], [-14, 14], [-7, 18], [-12, -4], [-8, -12], [-14, 2],
      [10, 8], [14, 14], [7, 18], [12, -4], [8, -12], [14, 2],
    ];

    initialItems.forEach((itemInfo, index) => {
      const pos = spawnPositions[index % spawnPositions.length];
      const x = pos[0] + (Math.random() - 0.5) * 2.5;
      const z = pos[1] + (Math.random() - 0.5) * 2.5;

      const itemGroup = new THREE.Group();
      const auraMat = new THREE.MeshBasicMaterial({
        color: itemInfo.isSchool ? 0x38bdf8 : 0xf87171,
        transparent: true,
        opacity: 0.45,
      });
      const aura = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 16), auraMat);
      aura.position.y = 0.05;
      itemGroup.add(aura);

      const meshObj = buildItemMesh(itemInfo.type, itemInfo.color);
      meshObj.position.y = 1.1;
      itemGroup.add(meshObj);

      itemGroup.position.set(x, 0, z);
      scene.add(itemGroup);

      worldItems.push({
        id: `item-init-${index}`,
        name: itemInfo.name,
        isSchoolItem: itemInfo.isSchool,
        mesh: itemGroup,
        x,
        z,
        collected: false,
        baseY: 1.1,
        points: itemInfo.isSchool ? 10 : -5,
        emoji: itemInfo.emoji,
        type: itemInfo.type,
        color: itemInfo.color,
      });
    });

    worldItemsRef.current = worldItems;

    // Render Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      let moveX = 0;
      let moveZ = 0;

      if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) moveZ -= 1;
      if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) moveZ += 1;
      if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) moveX -= 1;
      if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) moveX += 1;

      if (joystickRef.current.active) {
        moveX = joystickRef.current.x;
        moveZ = joystickRef.current.y;
      }

      const inputLength = Math.hypot(moveX, moveZ);
      const isMoving = inputLength > 0.1;
      const baseSpeed = 8.5;

      const player = playerPosRef.current;

      // Vertical Jump & Gravity physics
      if (!player.isGrounded) {
        player.vy -= 22 * delta; // Gravity pull
        player.y += player.vy * delta;
        if (player.y <= 0) {
          player.y = 0;
          player.vy = 0;
          player.isGrounded = true;
        }
      }

      if (isMoving) {
        const normX = moveX / (inputLength || 1);
        const normZ = moveZ / (inputLength || 1);

        let nextX = player.x + normX * baseSpeed * delta;
        let nextZ = player.z + normZ * baseSpeed * delta;

        // Tree Obstacle Collision (Player CANNOT pass through trees!)
        const PLAYER_RADIUS = 0.5;
        for (let pass = 0; pass < 2; pass++) {
          for (const obs of TREE_OBSTACLES) {
            const minDist = obs.radius + PLAYER_RADIUS;
            const curDist = Math.hypot(nextX - obs.x, nextZ - obs.z);
            if (curDist < minDist) {
              // Vector from tree center to player position before this frame
              const fromTreeX = player.x - obs.x;
              const fromTreeZ = player.z - obs.z;
              const prevDist = Math.hypot(fromTreeX, fromTreeZ);

              if (prevDist >= minDist) {
                // Tangent sliding: cancel velocity along the collision normal
                const nx = fromTreeX / prevDist;
                const nz = fromTreeZ / prevDist;
                const moveVecX = nextX - player.x;
                const moveVecZ = nextZ - player.z;
                const dot = moveVecX * nx + moveVecZ * nz;
                if (dot < 0) {
                  nextX -= dot * nx;
                  nextZ -= dot * nz;
                }

                // Hard clamp outside obstacle boundary
                const checkDist = Math.hypot(nextX - obs.x, nextZ - obs.z);
                if (checkDist < minDist) {
                  const cdx = nextX - obs.x;
                  const cdz = nextZ - obs.z;
                  const cd = Math.hypot(cdx, cdz) || 1;
                  nextX = obs.x + (cdx / cd) * minDist;
                  nextZ = obs.z + (cdz / cd) * minDist;
                }
              } else {
                // If already inside or overlapping, firmly push outward
                const dx = nextX - obs.x;
                const dz = nextZ - obs.z;
                const d = Math.hypot(dx, dz);
                if (d > 0.001) {
                  nextX = obs.x + (dx / d) * minDist;
                  nextZ = obs.z + (dz / d) * minDist;
                } else {
                  nextX = obs.x + minDist;
                  nextZ = obs.z;
                }
              }
            }
          }
        }

        // School Building Wall Collision
        if (nextZ < -17.5 && nextX > -14.5 && nextX < 14.5) {
          nextZ = -17.5;
        }

        // Boundary Limits
        nextX = Math.max(-25, Math.min(25, nextX));
        nextZ = Math.max(-17.5, Math.min(26, nextZ));

        player.x = nextX;
        player.z = nextZ;

        const targetRotation = Math.atan2(normX, normZ);
        player.rotation = targetRotation;

        const swingSpeed = 13;
        const swingAngle = Math.sin(elapsedTime * swingSpeed) * 0.55;
        if (leftLegRef.current && rightLegRef.current) {
          leftLegRef.current.rotation.x = player.isGrounded ? swingAngle : 0.4;
          rightLegRef.current.rotation.x = player.isGrounded ? -swingAngle : 0.4;
        }
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.x = -swingAngle * 0.8;
          rightArmRef.current.rotation.x = swingAngle * 0.8;
        }
      } else {
        if (leftLegRef.current && rightLegRef.current) {
          leftLegRef.current.rotation.x = player.isGrounded ? 0 : 0.4;
          rightLegRef.current.rotation.x = player.isGrounded ? 0 : 0.4;
        }
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.x = 0;
          rightArmRef.current.rotation.x = 0;
        }
      }

      if (characterMeshRef.current) {
        characterMeshRef.current.position.set(player.x, player.y, player.z);
        characterMeshRef.current.rotation.y = player.rotation;
      }

      // Elevated Camera Angle
      const targetCamX = player.x;
      const targetCamY = 12.0 + player.y * 0.5;
      const targetCamZ = player.z + 11.5;
      camera.position.x += (targetCamX - camera.position.x) * 0.1;
      camera.position.y += (targetCamY - camera.position.y) * 0.1;
      camera.position.z += (targetCamZ - camera.position.z) * 0.1;
      camera.lookAt(player.x, 1.2 + player.y * 0.5, player.z);

      // Rotate & Bob World Collectibles
      worldItemsRef.current.forEach((item) => {
        if (!item.collected && item.mesh) {
          item.mesh.rotation.y += 1.8 * delta;
          const childMesh = item.mesh.children[1];
          if (childMesh) {
            childMesh.position.y = item.baseY + Math.sin(elapsedTime * 3 + item.x) * 0.18;
          }
        }
      });

      if (collectionRingsRef.current) {
        collectionRingsRef.current.rotation.y += 0.8 * delta;
      }

      if (teacherMeshRef.current) {
        if (Date.now() - teacherJumpRef.current < 900) {
          teacherMeshRef.current.position.y = Math.abs(Math.sin(elapsedTime * 10)) * 0.8;
        } else {
          teacherMeshRef.current.position.y = 0;
        }
      }

      // AUTOMATIC PROXIMITY PICKUP
      if (!isBagOpenRef.current) {
        worldItemsRef.current.forEach((item) => {
          if (!item.collected) {
            if (item.canPickupAfter && Date.now() < item.canPickupAfter) return;
            const dist = Math.hypot(player.x - item.x, player.z - item.z);
            if (dist < 2.0) {
              handleAutoPickup(item);
            }
          }
        });
      }

      // Update distance to teacher's desk
      const curDist = Math.hypot(player.x - COLLECTION_ZONE.x, player.z - COLLECTION_ZONE.z);
      setDistanceToDesk(Math.round(curDist));

      // Draw Mini-Map Radar in top-left
      drawMinimap(player);

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [gameStage, selectedChar, teacherGender, handleAutoPickup]);

  // Touch handlers for virtual joystick — multitouch safe (tracks specific touch identifier)
  const joystickTouchId = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Only claim the first touch that lands on the joystick
    if (joystickTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = (touch.clientX - centerX) / (rect.width / 2);
    const dy = (touch.clientY - centerY) / (rect.height / 2);

    joystickRef.current = {
      x: Math.max(-1, Math.min(1, dx)),
      y: Math.max(-1, Math.min(1, dy)),
      active: true,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (joystickTouchId.current === null) return;
    // Find our specific touch among all active touches
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = (touch.clientX - centerX) / (rect.width / 2);
        const dy = (touch.clientY - centerY) / (rect.height / 2);

        joystickRef.current.x = Math.max(-1, Math.min(1, dx));
        joystickRef.current.y = Math.max(-1, Math.min(1, dy));
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    // Only release if it was our touch
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        joystickRef.current = { x: 0, y: 0, active: false };
        break;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between select-none overflow-hidden text-white font-sans">
      {/* 1. TOP STATUS BAR / HEADER */}
      <div className="relative z-30 px-3 py-2 bg-slate-900/85 backdrop-blur-md border-b border-white/10 flex items-center justify-between safe-top">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-lg shadow-sm">
            🎒
          </div>
          <div>
            <h1 className="font-fredoka font-bold text-sm sm:text-base leading-tight text-white flex items-center gap-1.5">
              <span>Kumpulkan Barang Sekolah</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-sans px-1.5 py-0.5 rounded border border-emerald-500/30">
                3D Open World
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Dekati barang di halaman untuk otomatis mengambilnya. Setor ke Meja Guru 🚩
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {gameStage === 'playing' && (
            <>
              {/* Score Indicator */}
              <div className="bg-amber-500/20 border border-amber-400/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="font-fredoka font-bold text-base text-yellow-300">
                  {score}
                </span>
                <span className="text-[10px] text-yellow-100 hidden sm:inline">Poin</span>
              </div>

              {/* Timer 60s */}
              <div
                className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 transition-colors ${
                  timeLeft <= 10
                    ? 'bg-rose-500/30 border-rose-400 text-rose-300 animate-pulse'
                    : 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="font-fredoka font-bold text-base">
                  {timeLeft}s
                </span>
              </div>
            </>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Game Button */}
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-400/30 transition-colors"
            title="Tutup Game"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN VIEW AREA */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* CHARACTER SELECTION STAGE */}
        {gameStage === 'character_select' && (
          <div className="absolute inset-0 z-40 bg-gradient-to-b from-slate-900 via-sky-950 to-slate-900 flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-xl border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-center my-auto animate-in zoom-in-95">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  Pilih Karakter Terlebih Dahulu
                </span>
                <h2 className="font-fredoka font-bold text-2xl text-white mt-2">
                  Petualangan 3D Sekolah 🏫
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Pilih karakter favoritmu untuk menjelajahi halaman sekolah dan mengumpulkan barang-barang edukasi!
                </p>
              </div>

              {/* Characters Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-left">
                {CHARACTERS_3D.map((char) => {
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
                          ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{char.emoji}</span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                      </div>
                      <div>
                        <div className="font-fredoka font-bold text-sm text-white">{char.name}</div>
                        <div className="text-[11px] text-amber-300 font-medium">{char.role}</div>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug line-clamp-2">
                        {char.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Game Rules Info Card */}
              <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-3 text-left flex flex-col gap-1.5 text-[11px] text-slate-300">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>Cara Bermain 60 Detik:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✅ Dekati Barang:</span>
                  <span>Otomatis masuk ke tas ransel. Barang baru akan terus muncul!</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sky-400 font-bold">🎒 Tombol Tas:</span>
                  <span>Periksa atau keluarkan barang bukan sekolah agar nilai aman.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">🦘 Tombol Lompat:</span>
                  <span>Melompati rintangan dan bergerak lebih seru di halaman.</span>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartGame}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-fredoka font-bold text-base rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all border border-emerald-300"
              >
                <span>Masuk ke Dunia 3D</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* 3D PLAYING CANVAS */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* IN-GAME HUD OVERLAYS */}
        {gameStage === 'playing' && (
          <>
            {/* TOP-LEFT: RADAR MINI-MAP — compact for all orientations */}
            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 pointer-events-auto">
              <div className="bg-slate-900/85 backdrop-blur-md border border-emerald-400/50 rounded-xl p-1.5 shadow-2xl flex flex-col items-center">
                <div className="flex items-center justify-between w-full px-0.5 mb-0.5 text-[9px]">
                  <span className="font-bold text-emerald-300 flex items-center gap-0.5 uppercase tracking-wider">
                    <Compass className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Radar</span>
                  </span>
                  <span className="text-[8px] bg-amber-400/20 text-amber-300 px-1 rounded border border-amber-400/30">
                    U
                  </span>
                </div>

                <div className="relative rounded-lg overflow-hidden border border-white/20 shadow-inner bg-slate-950">
                  <canvas
                    ref={minimapCanvasRef}
                    width={130}
                    height={130}
                    className="w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] block"
                  />
                </div>

                <div className="mt-1 w-full bg-slate-800/90 rounded px-1.5 py-0.5 border border-white/10 flex items-center justify-between text-[9px]">
                  <span className="text-amber-300 font-bold flex items-center gap-0.5">
                    <span>🚩 Meja:</span>
                  </span>
                  <span className="font-fredoka font-bold text-white">
                    {distanceToDesk}m
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Toast + Zone Notification — single slot top-center */}
            {toastMessage && (
              <div
                className={`absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-xl border font-bold text-[11px] shadow-xl backdrop-blur-md animate-in slide-in-from-top duration-200 flex items-center gap-1.5 max-w-[80%] text-center ${
                  toastMessage.isError
                    ? 'bg-rose-600/90 text-white border-rose-300'
                    : 'bg-emerald-600/90 text-white border-emerald-300'
                }`}
              >
                {toastMessage.isError ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0" />
                )}
                <span>{toastMessage.text}</span>
              </div>
            )}

            {/* IN-ZONE NOTIFICATION — below toast */}
            {isInsideCollectionZone() && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 z-25 bg-amber-500/90 backdrop-blur-md text-slate-950 font-fredoka font-bold text-[10px] px-3 py-1 rounded-full border-2 border-white shadow-xl animate-pulse flex items-center gap-1">
                <span>🚩 Area Meja Guru!</span>
              </div>
            )}

            {/* ON-SCREEN VIRTUAL JOYSTICK (Arah Jalan) — compact for landscape */}
            <div className="absolute bottom-32 left-4 z-20 flex flex-col items-center gap-0.5">
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-20 h-20 rounded-full bg-slate-900/60 backdrop-blur-md border-2 border-white/30 flex items-center justify-center relative touch-none shadow-xl active:border-emerald-400"
              >
                <div className="w-1 h-1 rounded-full bg-white/40" />

                <div
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white absolute pointer-events-none transition-transform duration-75"
                  style={{
                    transform: `translate(${joystickRef.current.x * 25}px, ${joystickRef.current.y * 25}px)`,
                  }}
                >
                  🕹️
                </div>
              </div>
              <span className="text-[9px] text-slate-300 font-bold bg-slate-900/70 px-1.5 py-0.5 rounded border border-white/10">
                Jalan
              </span>
            </div>

            {/* ACTION BUTTONS: TOMBOL LOMPAT & TOMBOL TAS — multitouch safe */}
            <div className="absolute bottom-4 right-4 z-20 flex items-end gap-2 pointer-events-auto">
              {/* TOMBOL LOMPAT — onTouchStart for instant response while joystick active */}
              <button
                onTouchStart={(e) => { e.stopPropagation(); handleJump(); }}
                onClick={handleJump}
                className="w-14 h-14 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border-2 border-amber-200 text-white flex flex-col items-center justify-center gap-0.5 shadow-xl shadow-amber-500/40 active:scale-90 transition-transform touch-none select-none"
                title="Lompat (Spasi)"
              >
                <span className="text-xl leading-none">🦘</span>
                <span className="text-[9px] font-fredoka font-bold tracking-wider">
                  LOMPAT
                </span>
              </button>

              {/* TOMBOL TAS — onTouchStart for instant response while joystick active */}
              <button
                onTouchStart={(e) => {
                  e.stopPropagation();
                  playSound('pop');
                  setIsBagOpen((prev) => !prev);
                }}
                onClick={() => {
                  playSound('pop');
                  setIsBagOpen((prev) => !prev);
                }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 border-2 border-sky-300 text-white flex flex-col items-center justify-center gap-0.5 shadow-2xl shadow-indigo-500/50 active:scale-90 transition-transform relative touch-none select-none"
                title="Buka Isi Tas Ransel"
              >
                <Backpack className="w-6 h-6 text-yellow-300" />
                <span className="text-[10px] font-fredoka font-bold leading-tight">
                  TAS
                </span>

                {/* Badge count of items */}
                <span
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-md transition-colors ${
                    heldItems.length > 0 ? 'bg-amber-400 text-slate-900 animate-bounce' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {heldItems.length}
                </span>
              </button>
            </div>

            {/* 3. INTERACTIVE BACKPACK MODAL / TRAY */}
            {isBagOpen && (
              <div
                className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center p-3 animate-in fade-in duration-200"
                onClick={() => setIsBagOpen(false)}
              >
                <div
                  className="w-full max-w-md bg-slate-900/95 border-2 border-sky-400/60 rounded-3xl p-4 shadow-2xl flex flex-col gap-3 max-h-[82vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Bag Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-xl">
                        🎒
                      </div>
                      <div>
                        <h3 className="font-fredoka font-bold text-base text-white flex items-center gap-1.5">
                          <span>Isi Tas Ransel</span>
                          <span className="text-xs bg-sky-500/30 text-sky-200 px-2 py-0.5 rounded-full">
                            {heldItems.length} Barang
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Keluarkan barang bukan sekolah agar nilai tidak berkurang!
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsBagOpen(false)}
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Gesture Discard Drop Hint */}
                  <div className="bg-slate-800/80 border border-dashed border-rose-400/50 rounded-2xl p-2 text-center text-xs text-rose-300 flex items-center justify-center gap-2">
                    <Hand className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>
                      {!(Capacitor.isNativePlatform() || (typeof window !== 'undefined' && window.innerWidth < 640)) ? (
                        <>
                          <strong>Geser item keluar untuk mengeluarkannya dari tas</strong> (atau tombol Keluarkan di layar besar)
                        </>
                      ) : (
                        <>
                          <strong>Geser item keluar untuk mengeluarkannya dari tas</strong>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[160px] max-h-[320px]">
                    {heldItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center gap-2 text-slate-400">
                        <Backpack className="w-12 h-12 opacity-40 text-slate-500" />
                        <p className="text-xs">
                          Tas ranselmu kosong. Dekati barang di halaman sekolah untuk mengambilnya!
                        </p>
                      </div>
                    ) : (
                      heldItems.map((item) => {
                        const isDragging = draggingItemId === item.id;
                        return (
                          <div
                            key={item.id}
                            onPointerDown={(e) => {
                              if ((e.target as HTMLElement).closest('button')) return;
                              dragStartPosRef.current = { x: e.clientX, y: e.clientY };
                              setDraggingItemId(item.id);
                              try {
                                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                              } catch {
                                // fallback if pointer capture unsupported
                              }
                            }}
                            onPointerMove={(e) => {
                              if (draggingItemId !== item.id) return;
                              const dx = e.clientX - dragStartPosRef.current.x;
                              const dy = e.clientY - dragStartPosRef.current.y;
                              setDragOffset({ x: dx, y: dy });
                            }}
                            onPointerUp={() => {
                              if (draggingItemId === item.id) {
                                if (Math.abs(dragOffset.x) > 50 || Math.abs(dragOffset.y) > 50) {
                                  discardItemFromBag(item);
                                }
                              }
                              setDraggingItemId(null);
                              setDragOffset({ x: 0, y: 0 });
                            }}
                            onPointerCancel={() => {
                              setDraggingItemId(null);
                              setDragOffset({ x: 0, y: 0 });
                            }}
                            style={{
                              transform: isDragging
                                ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`
                                : 'none',
                              opacity: isDragging ? 0.75 : 1,
                              transition: isDragging ? 'none' : 'transform 0.2s, opacity 0.2s',
                            }}
                            className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 shadow-md select-none touch-none ${
                              item.isSchoolItem
                                ? 'bg-emerald-950/40 border-emerald-500/40'
                                : 'bg-rose-950/40 border-rose-500/40 animate-pulse'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-2xl p-1 rounded-xl bg-white/10 shrink-0">{item.emoji}</span>
                              <div className="text-left min-w-0">
                                <div className="font-fredoka font-bold text-sm text-white truncate">{item.name}</div>
                                <div
                                  className={`text-[10px] font-bold ${
                                    item.isSchoolItem ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {item.isSchoolItem ? '✅ Perlengkapan Sekolah (+10)' : '⚠️ Bukan Sekolah (-5 Nilai)'}
                                </div>
                              </div>
                            </div>

                            {/* Discard Button (With direct pointer/click stopPropagation) */}
                            {!(Capacitor.isNativePlatform() || (typeof window !== 'undefined' && window.innerWidth < 640)) && (
                            <button
                              type="button"
                              onPointerDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                discardItemFromBag(item);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-fredoka font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer pointer-events-auto shrink-0 border border-rose-400/40"
                              title="Keluarkan dari tas"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                              <span>Keluarkan</span>
                            </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Bottom Close Button */}
                  <button
                    onClick={() => setIsBagOpen(false)}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-fredoka font-bold text-sm rounded-xl active:scale-95 transition-all"
                  >
                    Tutup Tas & Lanjutkan Berkeliling
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 4. GAME OVER MODAL (Waktu 60 Detik Habis) */}
        {gameStage === 'gameover' && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in zoom-in-95">
            <div className="max-w-md w-full bg-slate-900 border-2 border-emerald-400/50 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-inner animate-bounce">
                🏆
              </div>

              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  Waktu 60 Detik Selesai!
                </span>
                <h3 className="font-fredoka font-bold text-2xl sm:text-3xl text-white mt-2">
                  Hasil Akhir Pengumpulan
                </h3>
              </div>

              {/* Score Recap Card */}
              <div className="w-full bg-slate-800/80 rounded-2xl p-4 border border-white/10 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-sm border-b border-white/10 pb-2">
                  <span className="text-slate-300">Total Skor Diperoleh:</span>
                  <strong className="font-fredoka text-2xl text-yellow-300">
                    {score} Poin
                  </strong>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">🏆 Rekor: {highScore} poin</span>
                  {newRecord && (
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/40">
                      🎉 Rekor Baru!
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Barang Sekolah Terkumpul:</span>
                  </span>
                  <strong className="text-emerald-400 font-fredoka text-base">
                    +{schoolItemsCount} Barang
                  </strong>
                </div>

                {wrongItemsCount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-rose-300 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Barang Bukan Sekolah:</span>
                    </span>
                    <strong className="text-rose-400 font-fredoka text-base">
                      -{wrongItemsCount} Barang
                    </strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={handleStartGame}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-white font-fredoka font-bold text-sm rounded-xl shadow-md active:scale-95 flex items-center justify-center gap-1.5 border border-emerald-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Main Lagi</span>
                </button>

                <button
                  onClick={() => {
                    playSound('click');
                    onClose();
                  }}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-fredoka font-bold text-sm rounded-xl border border-white/20 active:scale-95"
                >
                  <span>Selesai & Keluar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
