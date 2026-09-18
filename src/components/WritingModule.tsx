import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ALPHABET_UPPER, 
  ALPHABET_LOWER, 
  NUMBERS, 
  WRITING_WORDS 
} from '../data/writingData';
import { WritingItem } from '../types';
import { playSound, speakIndonesian } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Volume2, 
  RotateCcw, 
  Eraser, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Pencil,
  Eye,
  EyeOff
} from 'lucide-react';

interface WritingModuleProps {
  onEarnStar: () => void;
  onRecordWriting: () => void;
}

const COLORS = [
  { name: 'Biru', hex: '#2563eb' },
  { name: 'Merah', hex: '#dc2626' },
  { name: 'Hijau', hex: '#16a34a' },
  { name: 'Ungu', hex: '#9333ea' },
  { name: 'Oranye', hex: '#ea580c' },
  { name: 'Hitam', hex: '#1e293b' },
];

const BRUSH_SIZES = [
  { label: 'Halus', size: 6 },
  { label: 'Sedang', size: 12 },
  { label: 'Tebal', size: 20 },
];

// Curated starting coordinates for tracing guide indicator ① (viewBox 0 0 400 300)
const START_POINTS: Record<string, { x: number; y: number }> = {
  // Uppercase (centered around x=222, y=65 to 225)
  A: { x: 222, y: 72 },
  B: { x: 172, y: 72 },
  C: { x: 265, y: 95 },
  D: { x: 172, y: 72 },
  E: { x: 172, y: 72 },
  F: { x: 172, y: 72 },
  G: { x: 265, y: 95 },
  H: { x: 172, y: 72 },
  I: { x: 222, y: 72 },
  J: { x: 240, y: 72 },
  K: { x: 172, y: 72 },
  L: { x: 172, y: 72 },
  M: { x: 172, y: 218 },
  N: { x: 172, y: 218 },
  O: { x: 222, y: 72 },
  P: { x: 172, y: 72 },
  Q: { x: 222, y: 72 },
  R: { x: 172, y: 72 },
  S: { x: 255, y: 90 },
  T: { x: 172, y: 72 },
  U: { x: 175, y: 78 },
  V: { x: 175, y: 75 },
  W: { x: 170, y: 75 },
  X: { x: 175, y: 75 },
  Y: { x: 175, y: 75 },
  Z: { x: 175, y: 75 },
  // Numbers
  '0': { x: 222, y: 72 },
  '1': { x: 205, y: 95 },
  '2': { x: 185, y: 95 },
  '3': { x: 185, y: 90 },
  '4': { x: 245, y: 175 },
  '5': { x: 235, y: 75 },
  '6': { x: 240, y: 90 },
  '7': { x: 175, y: 75 },
  '8': { x: 222, y: 72 },
  '9': { x: 245, y: 140 },
  // Lowercase
  a: { x: 255, y: 155 },
  b: { x: 178, y: 72 },
  c: { x: 255, y: 155 },
  d: { x: 255, y: 72 },
  e: { x: 180, y: 182 },
  f: { x: 240, y: 72 },
  g: { x: 255, y: 155 },
  h: { x: 178, y: 72 },
  i: { x: 222, y: 145 },
  j: { x: 222, y: 145 },
  k: { x: 178, y: 72 },
  l: { x: 222, y: 72 },
  m: { x: 175, y: 155 },
  n: { x: 175, y: 155 },
  o: { x: 222, y: 145 },
  p: { x: 178, y: 145 },
  q: { x: 255, y: 145 },
  r: { x: 180, y: 155 },
  s: { x: 245, y: 155 },
  t: { x: 222, y: 72 },
  u: { x: 178, y: 155 },
  v: { x: 178, y: 155 },
  w: { x: 175, y: 155 },
  x: { x: 178, y: 155 },
  y: { x: 178, y: 155 },
  z: { x: 178, y: 155 },
};

export default function WritingModule({ onEarnStar, onRecordWriting }: WritingModuleProps) {
  const [category, setCategory] = useState<'upper' | 'lower' | 'number' | 'word'>('upper');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('#2563eb');
  const [brushSize, setBrushSize] = useState(12);
  const [isEraser, setIsEraser] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showStartPoint, setShowStartPoint] = useState(true);
  const [feedback, setFeedback] = useState<{ show: boolean; msg: string; success: boolean } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const drawnPointsRef = useRef<number>(0);

  const currentItems = useMemo((): WritingItem[] => {
    switch (category) {
      case 'upper': return ALPHABET_UPPER;
      case 'lower': return ALPHABET_LOWER;
      case 'number': return NUMBERS;
      case 'word': return WRITING_WORDS;
      default: return ALPHABET_UPPER;
    }
  }, [category]);

  const currentItem = currentItems[currentIndex] || currentItems[0];

  // Calculate typography parameters for the SVG guide layer
  const typography = useMemo(() => {
    const text = currentItem.char;
    const centerX = 222; // taking red notebook margin line into account (margin at x=44)
    const baselineY = 225; // standard handwriting baseline

    let fontSize = 160;
    let letterSpacing = '0px';

    if (category === 'word') {
      if (text.length <= 3) {
        fontSize = 86;
        letterSpacing = '4px';
      } else if (text.length === 4) {
        fontSize = 72;
        letterSpacing = '3px';
      } else if (text.length === 5) {
        fontSize = 60;
        letterSpacing = '2px';
      } else if (text.length === 6) {
        fontSize = 50;
        letterSpacing = '1.5px';
      } else {
        fontSize = 42;
        letterSpacing = '1px';
      }
    } else if (category === 'lower') {
      const ascenders = ['b', 'd', 'f', 'h', 'k', 'l', 't'];
      const descenders = ['g', 'j', 'p', 'q', 'y'];
      if (ascenders.includes(text)) {
        fontSize = 155;
      } else if (descenders.includes(text)) {
        fontSize = 145;
      } else {
        fontSize = 145;
      }
    } else {
      // Uppercase or Number
      fontSize = 160;
    }

    const startPos = START_POINTS[text] || (
      category === 'word' 
        ? { x: 130, y: 160 } 
        : { x: centerX, y: 75 }
    );

    return { centerX, baselineY, fontSize, letterSpacing, startPos };
  }, [currentItem.char, category]);

  // Synchronize canvas resolution with container dimensions using ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.max(1, window.devicePixelRatio || 1);

      // Save drawn content temporarily across resizes
      let tempCanvas: HTMLCanvasElement | null = null;
      if (canvas.width > 0 && canvas.height > 0) {
        tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
        }
      }

      const physicalWidth = Math.round(rect.width * dpr);
      const physicalHeight = Math.round(rect.height * dpr);

      canvas.width = physicalWidth;
      canvas.height = physicalHeight;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Idempotently set exact scale mapping: 1 CSS pixel = (physicalWidth / rect.width)
        const scaleX = physicalWidth / rect.width;
        const scaleY = physicalHeight / rect.height;
        ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (tempCanvas && tempCanvas.width > 0 && tempCanvas.height > 0) {
          ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
        }
      }
    };

    updateCanvasSize();
    const observer = new ResizeObserver(() => {
      updateCanvasSize();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Clear canvas when character or category changes
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container ? container.getBoundingClientRect() : canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const scaleX = rect.width > 0 ? canvas.width / rect.width : dpr;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : dpr;

    // Reset transform completely, clear full buffer, re-apply exact 1:1 scale
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawnPointsRef.current = 0;
    setHasDrawn(false);
    setFeedback(null);
  }, []);

  useEffect(() => {
    clearCanvas();
  }, [category, currentIndex, clearCanvas]);

  // Pointer event handlers for drawing & erasing - pixel-exact coordinate calculation
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    return {
      x: Math.max(0, Math.min(rect.width, rawX)),
      y: Math.max(0, Math.min(rect.height, rawY)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    isDrawing.current = true;
    const coords = getCoordinates(e);
    lastPos.current = coords;
    drawnPointsRef.current += 1;
    setHasDrawn(true);
    setCursorPos(coords);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, brushSize * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = selectedColor;
      ctx.fill();
    }
    ctx.restore();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e);
    setCursorPos(coords);

    if (!isDrawing.current || !lastPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2.4;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.restore();

    lastPos.current = coords;
    drawnPointsRef.current += 1;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    isDrawing.current = false;
    lastPos.current = null;
  };

  const handleVoiceSample = () => {
    playSound('pop');
    let speechText = '';
    if (currentItem.type === 'letter_upper' || currentItem.type === 'letter_lower') {
      speechText = `Huruf ${currentItem.char}. Contoh kata: ${currentItem.pronounceWord || currentItem.char}.`;
    } else if (currentItem.type === 'number') {
      speechText = `Angka ${currentItem.char}. ${currentItem.pronounceWord || ''}.`;
    } else {
      speechText = `Kata: ${currentItem.char}. ${currentItem.pronounceWord || ''}.`;
    }
    speakIndonesian(speechText);
  };

  const handleCheckWriting = () => {
    if (!hasDrawn || drawnPointsRef.current < 8) {
      playSound('wrong');
      setFeedback({
        show: true,
        msg: 'Ayo coba tebalkan hurufnya di atas garis buku tulis ya!',
        success: false,
      });
      speakIndonesian('Ayo tebalkan hurufnya di atas garis ya!');
      return;
    }

    playSound('star');
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.6 },
    });

    onEarnStar();
    onRecordWriting();

    const praises = [
      'Hebat sekali! Tulisanmu sangat rapi!',
      'Luar biasa! Kamu semakin pintar menulis!',
      'Keren banget! Tanganmu lincah sekali!',
      'Bagus sekali! Dapat 1 Bintang Emas!',
    ];
    const randomPraise = praises[Math.floor(Math.random() * praises.length)];

    setFeedback({
      show: true,
      msg: randomPraise,
      success: true,
    });

    speakIndonesian(`Hebat sekali! Tulisanmu sangat bagus. ${currentItem.char}`);
  };

  const nextItem = () => {
    playSound('pop');
    if (currentIndex < currentItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const prevItem = () => {
    playSound('pop');
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(currentItems.length - 1);
    }
  };

  return (
    <div id="writing-module" className="flex flex-col gap-4 max-w-xl mx-auto pb-24">
      {/* Category selector */}
      <div className="bg-white/85 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-amber-100 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        <button
          id="tab-upper"
          onClick={() => { setCategory('upper'); setCurrentIndex(0); playSound('click'); }}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            category === 'upper'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          🔤 Huruf Besar (A-Z)
        </button>
        <button
          id="tab-lower"
          onClick={() => { setCategory('lower'); setCurrentIndex(0); playSound('click'); }}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            category === 'lower'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          🔡 Huruf Kecil (a-z)
        </button>
        <button
          id="tab-number"
          onClick={() => { setCategory('number'); setCurrentIndex(0); playSound('click'); }}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            category === 'number'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          🔢 Angka (0-9)
        </button>
        <button
          id="tab-word"
          onClick={() => { setCategory('word'); setCurrentIndex(0); playSound('click'); }}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            category === 'word'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          📝 Kata Dasar
        </button>
      </div>

      {/* Main interactive Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-md border-2 border-amber-200/80 flex flex-col gap-3">
        {/* Header with Title, Sound & Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{currentItem.exampleImage || '✍️'}</span>
            <div>
              <h2 className="text-xl font-fredoka font-bold text-slate-800 leading-tight">
                {currentItem.title}
              </h2>
              <p className="text-xs font-semibold text-amber-600">
                {category === 'word' ? `Ejaan: ${currentItem.phonics}` : `Contoh: ${currentItem.pronounceWord || currentItem.char}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Female Voice pronunciation button */}
            <button
              id="btn-voice-pronounce"
              onClick={handleVoiceSample}
              className="p-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-2xl flex items-center gap-1.5 font-bold text-xs transition-transform active:scale-95 shadow-xs"
              title="Dengarkan Suara Ibu Guru"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden xs:inline">Suara Ibu Guru</span>
            </button>

            <button
              id="btn-prev-char"
              onClick={prevItem}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl active:scale-95"
              title="Sebelumnya"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-400 px-1 whitespace-nowrap">
              {currentIndex + 1}/{currentItems.length}
            </span>
            <button
              id="btn-next-char"
              onClick={nextItem}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl active:scale-95"
              title="Selanjutnya"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stroke Hint Banner */}
        {currentItem.strokeHint && (
          <div className="bg-amber-50/90 rounded-xl p-2.5 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <span className="text-sm">💡</span>
            <p className="font-medium">{currentItem.strokeHint}</p>
          </div>
        )}

        {/* Drawing Board / Dual-Layer Writing Canvas */}
        <div 
          ref={containerRef}
          className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-300 bg-[#fdfbf7] shadow-inner select-none"
        >
          {/* BASE LAYER: High-precision SVG Ruled Lines and Proportional Tracing Letter */}
          <svg 
            viewBox="0 0 400 300" 
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
          >
            {/* Soft Paper Background */}
            <rect width="400" height="300" fill="#fdfbf7" />

            {/* Classic Red Notebook Margin line on the left */}
            <line x1="44" y1="0" x2="44" y2="300" stroke="#fca5a5" strokeWidth="1.75" />

            {/* Standard Primary Ruled Guidelines (Buku Tulis Halus Garis 4) */}
            {/* Top Line (Garis Atas) */}
            <line x1="16" y1="65" x2="384" y2="65" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,4" />
            {/* Midline (Garis Tengah / X-Height) */}
            <line x1="16" y1="145" x2="384" y2="145" stroke="#64748b" strokeWidth="1.5" strokeDasharray="6,6" />
            {/* Baseline (Garis Dasar Tebal) */}
            <line x1="16" y1="225" x2="384" y2="225" stroke="#334155" strokeWidth="3" />
            {/* Descender Line (Garis Bawah untuk ekor g, j, p, q, y) */}
            <line x1="16" y1="270" x2="384" y2="270" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />

            {/* Micro Labels on Left Margin for Teacher / Student Clarity */}
            <text x="14" y="68" fontSize="8" fill="#94a3b8" fontFamily="'Fredoka', sans-serif" fontWeight="bold">Atas</text>
            <text x="8" y="148" fontSize="8" fill="#64748b" fontFamily="'Fredoka', sans-serif" fontWeight="bold">Tengah</text>
            <text x="10" y="228" fontSize="8" fill="#334155" fontFamily="'Fredoka', sans-serif" fontWeight="bold">Dasar</text>

            {/* PROPORTIONAL TRACING GLYPH: Layer 1 (Soft Fill for Visual Recognition) */}
            <text
              x={typography.centerX}
              y={typography.baselineY}
              textAnchor="middle"
              fontSize={typography.fontSize}
              fontFamily="'Fredoka', 'Quicksand', sans-serif"
              fontWeight="bold"
              fill="rgba(203, 213, 225, 0.45)"
              letterSpacing={typography.letterSpacing}
            >
              {currentItem.char}
            </text>

            {/* PROPORTIONAL TRACING GLYPH: Layer 2 (High-Contrast Dashed Tracing Line) */}
            <text
              x={typography.centerX}
              y={typography.baselineY}
              textAnchor="middle"
              fontSize={typography.fontSize}
              fontFamily="'Fredoka', 'Quicksand', sans-serif"
              fontWeight="bold"
              fill="none"
              stroke="#475569"
              strokeWidth="3.5"
              strokeDasharray="8,8"
              strokeLinecap="round"
              strokeLinejoin="round"
              letterSpacing={typography.letterSpacing}
            >
              {currentItem.char}
            </text>

            {/* Starting Point Indicator (Titik Mulai ①) */}
            {showStartPoint && (
              <g className="transition-opacity duration-300">
                {/* Glow ring */}
                <circle 
                  cx={typography.startPos.x} 
                  cy={typography.startPos.y} 
                  r="13" 
                  fill="#22c55e" 
                  opacity="0.25"
                />
                {/* Core green dot */}
                <circle 
                  cx={typography.startPos.x} 
                  cy={typography.startPos.y} 
                  r="9" 
                  fill="#16a34a" 
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {/* Starting step label ① */}
                <text 
                  x={typography.startPos.x} 
                  y={typography.startPos.y + 3.5} 
                  fill="#ffffff" 
                  fontSize="10" 
                  fontWeight="bold" 
                  textAnchor="middle"
                  fontFamily="'Fredoka', sans-serif"
                >
                  1
                </text>
              </g>
            )}
          </svg>

          {/* TOP LAYER: Transparent Ink Canvas for Drawing and Erasing */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={() => setCursorPos(null)}
            className="absolute inset-0 w-full h-full block cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
          />

          {/* Active pointer brush/eraser precision indicator */}
          {cursorPos && (
            <div
              className="pointer-events-none absolute rounded-full border-2 border-slate-700/80 -translate-x-1/2 -translate-y-1/2 z-10 transition-transform duration-75 ease-out shadow-sm"
              style={{
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y}px`,
                width: `${isEraser ? brushSize * 2.4 : Math.max(14, brushSize)}px`,
                height: `${isEraser ? brushSize * 2.4 : Math.max(14, brushSize)}px`,
                backgroundColor: isEraser ? 'rgba(255, 255, 255, 0.75)' : selectedColor,
                boxShadow: '0 0 0 1.5px rgba(255, 255, 255, 0.9), 0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              <div className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
            </div>
          )}

          {/* Guidelines info watermark badge */}
          <div className="absolute bottom-2 left-3 pointer-events-none flex items-center gap-1.5 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200 text-[10px] text-slate-500 font-bold tracking-wide">
            <span>✏️ Tebalkan garis putus-putus</span>
          </div>

          {/* Starting point indicator toggle button */}
          <button
            onClick={() => setShowStartPoint(!showStartPoint)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-600 border border-slate-200 text-[10px] font-bold flex items-center gap-1 shadow-xs active:scale-95"
            title={showStartPoint ? 'Sembunyikan Titik Mulai' : 'Tampilkan Titik Mulai'}
          >
            {showStartPoint ? <Eye className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
            <span>Titik Mulai</span>
          </button>
        </div>

        {/* Tools bar: Colors & Brush Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          {/* Color swatches */}
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                id={`color-${c.name}`}
                onClick={() => {
                  setSelectedColor(c.hex);
                  setIsEraser(false);
                  playSound('pop');
                }}
                className={`w-7 h-7 rounded-full transition-transform active:scale-90 ${
                  !isEraser && selectedColor === c.hex
                    ? 'ring-3 ring-amber-400 scale-110 shadow-sm'
                    : 'opacity-85 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
                title={`Warna ${c.name}`}
              />
            ))}
          </div>

          {/* Brush thickness selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.size}
                id={`brush-${b.label}`}
                onClick={() => {
                  setBrushSize(b.size);
                  playSound('pop');
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  brushSize === b.size
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Action buttons: Pencil, Eraser, Clear */}
          <div className="flex items-center gap-1.5">
            <button
              id="tool-pen"
              onClick={() => { setIsEraser(false); playSound('click'); }}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                !isEraser ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Pensil</span>
            </button>

            <button
              id="tool-eraser"
              onClick={() => { setIsEraser(true); playSound('click'); }}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                isEraser ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
              title="Hapus coretan tanpa menghilangkan garis buku"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>

            <button
              id="tool-clear"
              onClick={() => { clearCanvas(); playSound('click'); }}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95"
              title="Bersihkan Semua Coretan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Action Check button */}
        <div className="pt-2 flex items-center gap-2">
          <button
            id="btn-check-writing"
            onClick={handleCheckWriting}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-fredoka font-bold text-base rounded-2xl shadow-md active:scale-98 flex items-center justify-center gap-2 transition-transform"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>Periksa & Kumpulkan Bintang</span>
          </button>
          <button
            id="btn-next-step"
            onClick={nextItem}
            className="py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-fredoka font-bold rounded-2xl shadow-md active:scale-95 flex items-center gap-1"
            title="Lanjut Huruf Berikutnya"
          >
            <span>Lanjut</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Praise / Feedback popup banner */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl flex items-center justify-between gap-2 text-sm font-bold animate-soft-bounce ${
              feedback.success
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border border-amber-300 text-amber-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <span className="text-lg">✏️</span>
              )}
              <span>{feedback.msg}</span>
            </div>
            {feedback.success && (
              <button
                onClick={nextItem}
                className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <span>Berikutnya</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick selection carousel below */}
      <div className="bg-white/70 p-3 rounded-2xl border border-amber-100">
        <p className="text-xs font-bold text-slate-500 mb-2">Pilih Huruf / Angka / Kata:</p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {currentItems.map((item, idx) => (
            <button
              key={item.id}
              id={`quick-item-${idx}`}
              onClick={() => {
                setCurrentIndex(idx);
                playSound('click');
              }}
              className={`flex-shrink-0 w-10 h-10 rounded-xl font-fredoka font-bold text-sm flex items-center justify-center transition-all ${
                currentIndex === idx
                  ? 'bg-indigo-600 text-white scale-105 shadow-sm ring-2 ring-indigo-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-amber-100'
              }`}
            >
              {item.char.length > 2 ? item.char.slice(0, 3) : item.char}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
