import { DifficultyLevel, QuizLevel, QuizQuestion } from '../types';

/**
 * Seeded PRNG to generate 200 distinct, deterministic levels with 10 questions each
 */
function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffleWithPrng<T>(array: T[], prng: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Vocabularies organized strictly by difficulty
const EASY_WORDS = [
  { word: 'APEL', emoji: '🍎', syllables: 'A - PEL', hint: 'Buah manis berwarna merah' },
  { word: 'BOLA', emoji: '⚽', syllables: 'BO - LA', hint: 'Benda bulat untuk bermain bola' },
  { word: 'BUKU', emoji: '📖', syllables: 'BU - KU', hint: 'Benda yang kita baca untuk belajar' },
  { word: 'IKAN', emoji: '🐟', syllables: 'I - KAN', hint: 'Hewan yang berenang di dalam air' },
  { word: 'KUCING', emoji: '🐱', syllables: 'KU - CING', hint: 'Hewan lucu yang bersuara meong' },
  { word: 'SAPI', emoji: '🐮', syllables: 'SA - PI', hint: 'Hewan penghasil susu segar' },
  { word: 'TOPI', emoji: '🧢', syllables: 'TO - PI', hint: 'Benda pelindung kepala dari panas' },
  { word: 'SUSU', emoji: '🥛', syllables: 'SU - SU', hint: 'Minuman sehat kaya kalsium' },
  { word: 'MATA', emoji: '👀', syllables: 'MA - TA', hint: 'Indra untuk melihat pemandangan' },
  { word: 'MEJA', emoji: '🪑', syllables: 'ME - JA', hint: 'Tempat menaruh buku saat belajar' },
  { word: 'ROTI', emoji: '🍞', syllables: 'RO - TI', hint: 'Makanan lezat untuk sarapan' },
  { word: 'KUDA', emoji: '🐴', syllables: 'KU - DA', hint: 'Hewan tangguh yang suka berlari' },
];

const MEDIUM_WORDS = [
  { word: 'SEKOLAH', emoji: '🏫', syllables: 'SE - KO - LAH', hint: 'Tempat kita menuntut ilmu bersama guru' },
  { word: 'SEPEDA', emoji: '🚲', syllables: 'SE - PE - DA', hint: 'Kendaraan roda dua yang dikayuh' },
  { word: 'KELINCI', emoji: '🐰', syllables: 'KE - LIN - CI', hint: 'Hewan bertelinga panjang suka wortel' },
  { word: 'BINTANG', emoji: '⭐', syllables: 'BIN - TANG', hint: 'Benda langit gemerlap di waktu malam' },
  { word: 'KERETA', emoji: '🚂', syllables: 'KE - RE - TA', hint: 'Kendaraan panjang yang berjalan di rel' },
  { word: 'POHON', emoji: '🌳', syllables: 'PO - HON', hint: 'Tumbuhan berdaun rindang dan berkayu' },
  { word: 'GAJAH', emoji: '🐘', syllables: 'GA - JAH', hint: 'Hewan darat berbelalai panjang' },
  { word: 'JERUK', emoji: '🍊', syllables: 'JE - RUK', hint: 'Buah segar kaya kandungan vitamin C' },
  { word: 'BUNGA', emoji: '🌸', syllables: 'BU - NGA', hint: 'Tumbuhan harum berwarna-warni indah' },
  { word: 'PISANG', emoji: '🍌', syllables: 'PI - SANG', hint: 'Buah berwarna kuning bergizi tinggi' },
  { word: 'PELANGI', emoji: '🌈', syllables: 'PE - LA - NGI', hint: 'Lengkung warna-warni setelah hujan' },
  { word: 'DONAT', emoji: '🍩', syllables: 'DO - NAT', hint: 'Kue bulat manis dengan lubang di tengah' },
];

const HARD_WORDS = [
  { word: 'PERPUSTAKAAN', emoji: '🏛️', syllables: 'PER - PUS - TA - KA - AN', hint: 'Gedung tempat ribuan buku bacaan' },
  { word: 'PEMANDANGAN', emoji: '🏞️', syllables: 'PE - MAN - DA - NGAN', hint: 'Keindahan alam yang mempesona' },
  { word: 'MENYENANGKAN', emoji: '🎉', syllables: 'ME - NYE - NANG - KAN', hint: 'Perasaan gembira dan penuh sukacita' },
  { word: 'KEBERSIHAN', emoji: '✨', syllables: 'KE - BER - SI - HAN', hint: 'Keadaan rapi, suci, dan bebas kuman' },
  { word: 'BEROLAHRAGA', emoji: '🏃', syllables: 'BER - O - LAH - RA - GA', hint: 'Aktivitas gerak badan agar badan bugar' },
  { word: 'MATAHARI', emoji: '☀️', syllables: 'MA - TA - HA - RI', hint: 'Pusat tata surya yang menyinari bumi' },
  { word: 'KESEHATAN', emoji: '🩺', syllables: 'KE - SE - HA - TAN', hint: 'Kondisi tubuh fit tanpa penyakit' },
  { word: 'LINGKUNGAN', emoji: '🌿', syllables: 'LING - KU - NGAN', hint: 'Daerah sekitar tempat makhluk hidup tinggal' },
  { word: 'KEMERDEKAAN', emoji: '🇮🇩', syllables: 'KE - MER - DE - KA - AN', hint: 'Kondisi bebas dan berdaulat bangsa' },
  { word: 'PENGALAMAN', emoji: '🧭', syllables: 'PENG - A - LA - MAN', hint: 'Peristiwa yang pernah dialami seseorang' },
];

export function getQuizLevel(levelNum: number, difficulty: DifficultyLevel = 'mudah'): QuizLevel {
  const difficultyMultiplier = difficulty === 'mudah' ? 1000 : difficulty === 'sedang' ? 2000 : 3000;
  const prng = createPrng(levelNum * 7919 + difficultyMultiplier + 101);

  // Groupings based on difficulty & level
  let ageGroup: QuizLevel['ageGroup'] = '6-7 thn (Kls 1)';
  const diffLabel = difficulty === 'mudah' ? 'Mudah' : difficulty === 'sedang' ? 'Sedang' : 'Sulit';
  let theme = `Petualangan Belajar (${diffLabel})`;

  if (difficulty === 'sulit' || levelNum > 130) {
    ageGroup = '9-10 thn (Kls 4)';
    theme = `Tantangan Juara Pintar [${diffLabel}] - Level ${levelNum}`;
  } else if (difficulty === 'sedang' || levelNum > 70) {
    ageGroup = '7-8 thn (Kls 2)';
    theme = `Kecerdasan Kata & Angka [${diffLabel}] - Level ${levelNum}`;
  } else {
    ageGroup = '6-7 thn (Kls 1)';
    theme = `Langkah Pertama Anak Cerdas [${diffLabel}] - Level ${levelNum}`;
  }

  const questions: QuizQuestion[] = [];

  for (let q = 1; q <= 10; q++) {
    const qTypeRand = prng();
    let question: QuizQuestion;

    if (qTypeRand < 0.45) {
      // 1. SOAL MATEMATIKA (Rentang angka disesuaikan otomatis dengan tingkat kesulitan)
      const isAdd = prng() > 0.4;
      const emojis = ['🍎', '⭐', '🎈', '🍬', '🚗', '🐱', '🐣', '🍓'];
      const em = emojis[Math.floor(prng() * emojis.length)];

      if (difficulty === 'mudah') {
        // MUDAH: Rentang Angka 1 - 10 dengan visualisasi emoji melimpah
        if (isAdd) {
          const a = Math.floor(prng() * 5) + 1; // 1 - 5
          const b = Math.floor(prng() * 5) + 1; // 1 - 5
          const ans = a + b; // max 10
          const wrong1 = ans + 1;
          const wrong2 = Math.max(1, ans - 1);
          const wrong3 = ans + 2;
          const opts = shuffleWithPrng([String(ans), String(wrong1), String(wrong2), String(wrong3)], prng);

          question = {
            id: `l${levelNum}_${difficulty}_q${q}`,
            question: `Berapakah hasil dari ${a} + ${b} ?`,
            subText: `${em.repeat(a)} + ${em.repeat(b)} = ... (Hitung semua ${em})`,
            category: 'matematika',
            visualEmoji: em,
            options: opts,
            correctAnswer: String(ans),
            explanation: `Jumlahkan semua ${em}: ${a} ditambah ${b} adalah ${ans}.`,
          };
        } else {
          const a = Math.floor(prng() * 5) + 5; // 5 - 9
          const b = Math.floor(prng() * 4) + 1; // 1 - 4
          const ans = a - b; // 1 - 8
          const wrong1 = ans + 1;
          const wrong2 = Math.max(0, ans - 1);
          const wrong3 = ans + 2;
          const opts = shuffleWithPrng([String(ans), String(wrong1), String(wrong2), String(wrong3)], prng);

          question = {
            id: `l${levelNum}_${difficulty}_q${q}`,
            question: `Berapakah sisa dari ${a} - ${b} ?`,
            subText: `Ada ${a} ${em}, diambil ${b} ${em}. Berapa sisa ${em}?`,
            category: 'matematika',
            visualEmoji: '➖',
            options: opts,
            correctAnswer: String(ans),
            explanation: `${a} dikurangi ${b} menghasilkan sisa ${ans}.`,
          };
        }
      } else if (difficulty === 'sedang') {
        // SEDANG: Rentang Angka 1 - 25 (Soal cerita dasar & operasi belasan)
        const names = ['Budi', 'Siti', 'Rani', 'Dito', 'Alif'];
        const kid = names[Math.floor(prng() * names.length)];
        const things = ['permen', 'buku tulis', 'kelereng', 'pensil warna', 'stiker'];
        const thing = things[Math.floor(prng() * things.length)];

        if (isAdd) {
          const a = Math.floor(prng() * 9) + 6; // 6 - 14
          const b = Math.floor(prng() * 7) + 4; // 4 - 10
          const ans = a + b; // 10 - 24
          const opts = shuffleWithPrng([String(ans), String(ans + 2), String(Math.max(1, ans - 2)), String(ans + 3)], prng);

          question = {
            id: `l${levelNum}_${difficulty}_q${q}`,
            question: `${kid} punya ${a} ${thing}. Ibu memberi ${b} ${thing} lagi. Berapa total ${thing} ${kid} sekarang?`,
            subText: `Operasi hitung: ${a} + ${b} = ?`,
            category: 'matematika',
            visualEmoji: '🧮',
            options: opts,
            correctAnswer: String(ans),
            explanation: `${a} + ${b} = ${ans}. ${kid} memiliki ${ans} ${thing}.`,
          };
        } else {
          const a = Math.floor(prng() * 10) + 15; // 15 - 24
          const b = Math.floor(prng() * 8) + 3;  // 3 - 10
          const ans = a - b; // 5 - 21
          const opts = shuffleWithPrng([String(ans), String(ans + 1), String(Math.max(0, ans - 1)), String(ans + 3)], prng);

          question = {
            id: `l${levelNum}_${difficulty}_q${q}`,
            question: `Di toples ada ${a} ${thing}. Dimakan bersama teman ${b} ${thing}. Sisa berapa ${thing} di toples?`,
            subText: `Operasi hitung: ${a} - ${b} = ?`,
            category: 'matematika',
            visualEmoji: '📦',
            options: opts,
            correctAnswer: String(ans),
            explanation: `${a} dikurangi ${b} menghasilkan sisa ${ans}.`,
          };
        }
      } else {
        // SULIT: Rentang Angka 1 - 100 (Operasi puluhan susun & tebak angka rumpang)
        const isPuzzle = prng() > 0.6;
        if (isPuzzle) {
          const a = Math.floor(prng() * 30) + 20; // 20 - 49
          const b = Math.floor(prng() * 30) + 15; // 15 - 44
          const total = a + b;
          const opts = shuffleWithPrng([String(b), String(b + 5), String(Math.max(1, b - 5)), String(b + 2)], prng);

          question = {
            id: `l${levelNum}_${difficulty}_q${q}`,
            question: `Berapakah angka yang tepat untuk melengkapi: ${a} + [ ... ] = ${total} ?`,
            subText: `Tips: Kurangkan ${total} dengan ${a}.`,
            category: 'matematika',
            visualEmoji: '🧩',
            options: opts,
            correctAnswer: String(b),
            explanation: `${total} - ${a} = ${b}. Jadi angka yang dicari adalah ${b}.`,
          };
        } else if (isAdd) {
          const a = Math.floor(prng() * 35) + 25; // 25 - 59
          const b = Math.floor(prng() * 30) + 15; // 15 - 44
          const ans = a + b; // 40 - 103
          const opts = shuffleWithPrng([String(ans), String(ans + 10), String(ans - 10), String(ans + 2)], prng);

          question = {
            id: `l${levelNum}_${difficulty}_q${q}`,
            question: `Toko buku memiliki ${a} buku tulis dan ${b} buku gambar. Berapa total seluruh buku?`,
            subText: `Operasi hitung susun: ${a} + ${b} = ...`,
            category: 'matematika',
            visualEmoji: '📚',
            options: opts,
            correctAnswer: String(ans),
            explanation: `${a} + ${b} = ${ans}. Total seluruh buku adalah ${ans}.`,
          };
        } else {
          const a = Math.floor(prng() * 45) + 50; // 50 - 94
          const b = Math.floor(prng() * 30) + 15; // 15 - 44
          const ans = a - b; // 6 - 79
          const opts = shuffleWithPrng([String(ans), String(ans + 10), String(Math.max(1, ans - 10)), String(ans + 2)], prng);

          question = {
            id: `l${levelNum}_${difficulty}_q${q}`,
            question: `Pak Tani memanen ${a} buah semangka. Terjual sebanyak ${b} semangka. Berapa sisa semangka?`,
            subText: `Operasi pengurangan: ${a} - ${b} = ...`,
            category: 'matematika',
            visualEmoji: '🍉',
            options: opts,
            correctAnswer: String(ans),
            explanation: `${a} - ${b} = ${ans}. Semangka yang tersisa adalah ${ans} buah.`,
          };
        }
      }
    } else if (qTypeRand < 0.78) {
      // 2. SOAL MEMBACA & KATA (Kompleksitas kata disesuaikan dengan tingkat kesulitan)
      if (difficulty === 'mudah') {
        // MUDAH: Kata 2 suku kata sederhana
        const item = EASY_WORDS[Math.floor(prng() * EASY_WORDS.length)];
        const wrongWords = EASY_WORDS.filter(w => w.word !== item.word).map(w => w.word);
        const shuffledWrongs = shuffleWithPrng(wrongWords, prng).slice(0, 3);
        const opts = shuffleWithPrng([item.word, ...shuffledWrongs], prng);

        question = {
          id: `l${levelNum}_${difficulty}_q${q}`,
          question: `Gambar ${item.emoji} ini dieja menjadi kata apa?`,
          subText: `Petunjuk: "${item.hint}" (Suku kata: ${item.syllables})`,
          category: 'membaca',
          visualEmoji: item.emoji,
          options: opts,
          correctAnswer: item.word,
          explanation: `Gambar ${item.emoji} adalah ${item.word}. Suku kata: ${item.syllables}.`,
        };
      } else if (difficulty === 'sedang') {
        // SEDANG: Kata 2-3 suku kata dengan gabungan konsonan & lawan kata
        const isAntonym = prng() > 0.5;
        if (isAntonym) {
          const antonyms = [
            { q: 'Lawan kata (antonim) dari kata "BESAR" adalah...', ans: 'Kecil', wrg: ['Tinggi', 'Panjang', 'Luas'], em: '🐘🐁' },
            { q: 'Lawan kata (antonim) dari kata "TERANG" adalah...', ans: 'Gelap', wrg: ['Siang', 'Silau', 'Malam'], em: '☀️🌙' },
            { q: 'Lawan kata (antonim) dari kata "PANAS" adalah...', ans: 'Dingin', wrg: ['Hangat', 'Sejuk', 'Beku'], em: '🔥🧊' },
            { q: 'Lawan kata (antonim) dari kata "BERSIH" adalah...', ans: 'Kotor', wrg: ['Rapi', 'Basah', 'Wangi'], em: '🧼🧽' },
            { q: 'Lawan kata (antonim) dari kata "CEPAT" adalah...', ans: 'Lambat', wrg: ['Jauh', 'Pelan-pelan', 'Dekat'], em: '🐆🐢' },
          ];
          const itm = antonyms[Math.floor(prng() * antonyms.length)];
          const opts = shuffleWithPrng([itm.ans, ...itm.wrg], prng);

          question = {
            id: `l${levelNum}_${difficulty}_q${q}`,
            question: itm.q,
            category: 'membaca',
            visualEmoji: itm.em,
            options: opts,
            correctAnswer: itm.ans,
            explanation: `Lawan kata yang tepat adalah "${itm.ans}".`,
          };
        } else {
          const item = MEDIUM_WORDS[Math.floor(prng() * MEDIUM_WORDS.length)];
          const wrongWords = MEDIUM_WORDS.filter(w => w.word !== item.word).map(w => w.word);
          const shuffledWrongs = shuffleWithPrng(wrongWords, prng).slice(0, 3);
          const opts = shuffleWithPrng([item.word, ...shuffledWrongs], prng);

          question = {
            id: `l${levelNum}_${difficulty}_q${q}`,
            question: `Manakah ejaan kata yang benar untuk gambar ${item.emoji}?`,
            subText: `Petunjuk: "${item.hint}" (Suku kata: ${item.syllables})`,
            category: 'membaca',
            visualEmoji: item.emoji,
            options: opts,
            correctAnswer: item.word,
            explanation: `Gambar ${item.emoji} dieja ${item.word}. Suku kata: ${item.syllables}.`,
          };
        }
      } else {
        // SULIT: Kata 3-4 suku kata kompleks, imbuhan, dan pemahaman kalimat
        const isComplexWord = prng() > 0.45;
        if (isComplexWord) {
          const item = HARD_WORDS[Math.floor(prng() * HARD_WORDS.length)];
          const wrongWords = HARD_WORDS.filter(w => w.word !== item.word).map(w => w.word);
          const shuffledWrongs = shuffleWithPrng(wrongWords, prng).slice(0, 3);
          const opts = shuffleWithPrng([item.word, ...shuffledWrongs], prng);

          question = {
            id: `l${levelNum}_${difficulty}_q${q}`,
            question: `Manakah kata 3-4 suku kata yang tepat untuk petunjuk: "${item.hint}"?`,
            subText: `Suku kata: ${item.syllables}`,
            category: 'membaca',
            visualEmoji: item.emoji,
            options: opts,
            correctAnswer: item.word,
            explanation: `Kata yang tepat adalah "${item.word}" (${item.syllables}).`,
          };
        } else {
          const advancedGrammar = [
            { q: 'Pilihlah kalimat yang menggunakan huruf kapital dan tanda titik secara tepat:', ans: 'Budi dan Ani membaca buku di perpustakaan.', wrg: ['budi dan ani membaca buku di perpustakaan', 'Budi Dan Ani Membaca Buku Di Perpustakaan?', 'budi Dan Ani membaca buku Di perpustakaan.'], em: '✍️' },
            { q: 'Sinonim (persamaan makna kata) dari kata "CERDAS" adalah...', ans: 'Pintar', wrg: ['Rajin', 'Kuat', 'Cepat'], em: '💡' },
            { q: 'Antonim (lawan kata) dari kata "HEMAT" adalah...', ans: 'Boros', wrg: ['Kikir', 'Pelit', 'Murah'], em: '💰' },
            { q: 'Kata dasar dari kata berimbuhan "MENYENANGKAN" adalah...', ans: 'Senang', wrg: ['Nyaman', 'Menang', 'Suka'], em: '😊' },
            { q: 'Kata dasar dari kata berimbuhan "BEROLAHRAGA" adalah...', ans: 'Olahraga', wrg: ['Raga', 'Olah', 'Raga-olahraga'], em: '⚽' },
          ];
          const itm = advancedGrammar[Math.floor(prng() * advancedGrammar.length)];
          const opts = shuffleWithPrng([itm.ans, ...itm.wrg], prng);

          question = {
            id: `l${levelNum}_${difficulty}_q${q}`,
            question: itm.q,
            category: 'membaca',
            visualEmoji: itm.em,
            options: opts,
            correctAnswer: itm.ans,
            explanation: `Jawaban tepat adalah "${itm.ans}".`,
          };
        }
      }
    } else {
      // 3. SOAL MENULIS / ALFABET / PENGETAHUAN UMUM
      if (difficulty === 'mudah') {
        const alphabetSamples = [
          { char: 'A', desc: 'Huruf vokal pertama' },
          { char: 'B', desc: 'Huruf awal dari kata BOLA' },
          { char: 'C', desc: 'Huruf awal dari kata CERI' },
          { char: 'D', desc: 'Huruf awal dari kata DAUN' },
          { char: 'K', desc: 'Huruf awal dari kata KUCING' },
          { char: 'M', desc: 'Huruf awal dari kata MOBIL' },
          { char: 'S', desc: 'Huruf awal dari kata SAPI' },
          { char: 'T', desc: 'Huruf awal dari kata TOPI' },
          { char: 'R', desc: 'Huruf awal dari kata RUMAH' },
        ];
        const sample = alphabetSamples[Math.floor(prng() * alphabetSamples.length)];
        const allLetters = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];
        const wrg = shuffleWithPrng(allLetters.filter(l => l !== sample.char), prng).slice(0, 3);
        const opts = shuffleWithPrng([sample.char, ...wrg], prng);

        question = {
          id: `l${levelNum}_${difficulty}_q${q}`,
          question: `Manakah huruf alfabet yang merupakan: "${sample.desc}"?`,
          subText: `Pilihlah huruf yang tepat:`,
          category: 'menulis',
          visualEmoji: '✍️',
          options: opts,
          correctAnswer: sample.char,
          explanation: `Jawaban tepat adalah huruf "${sample.char}". ${sample.desc}.`,
        };
      } else if (difficulty === 'sedang') {
        const fillBlanks = [
          { q: 'Lengkapilah suku kata rumpang: "K E L I N _ _"', ans: 'CI', wrg: ['GA', 'KU', 'TI'], em: '🐰' },
          { q: 'Lengkapilah suku kata rumpang: "M A T A H A _ _"', ans: 'RI', wrg: ['LA', 'RO', 'KA'], em: '☀️' },
          { q: 'Lengkapilah suku kata rumpang: "P E L A N _ _"', ans: 'GI', wrg: ['DA', 'MI', 'KA'], em: '🌈' },
          { q: 'Benda apa yang kita pakai saat hujan agar tidak basah?', ans: 'Payung', wrg: ['Kipas angin', 'Sandal jepit', 'Topi koboi'], em: '☔' },
          { q: 'Hewan berkaki empat yang memakan rumput dan menghasilkan susu adalah...', ans: 'Sapi', wrg: ['Kucing', 'Ayam', 'Bebek'], em: '🐮' },
        ];
        const itm = fillBlanks[Math.floor(prng() * fillBlanks.length)];
        const opts = shuffleWithPrng([itm.ans, ...itm.wrg], prng);

        question = {
          id: `l${levelNum}_${difficulty}_q${q}`,
          question: itm.q,
          category: 'menulis',
          visualEmoji: itm.em,
          options: opts,
          correctAnswer: itm.ans,
          explanation: `Jawaban yang benar adalah "${itm.ans}".`,
        };
      } else {
        const scienceKnowledge = [
          { q: 'Kelanjutan pola bilangan lompat 5: 15, 20, 25, 30, ... adalah?', ans: '35', wrg: ['32', '40', '34'], em: '🔢' },
          { q: 'Organ tubuh manusia yang berfungsi untuk memompa darah adalah...', ans: 'Jantung', wrg: ['Paru-paru', 'Lambung', 'Hati'], em: '❤️' },
          { q: 'Manakah kelompok benda yang berwujud cair di bawah ini?', ans: 'Air, minyak, dan susu', wrg: ['Batu, kayu, dan besi', 'Asap dan udara', 'Buku dan meja'], em: '💧' },
          { q: 'Matahari terbit di sebelah timur dan terbenam di sebelah...', ans: 'Barat', wrg: ['Utara', 'Selatan', 'Tengah'], em: '🌅' },
          { q: 'Berapakah jumlah hari dalam 4 minggu?', ans: '28 hari', wrg: ['21 hari', '30 hari', '24 hari'], em: '📅' },
        ];
        const itm = scienceKnowledge[Math.floor(prng() * scienceKnowledge.length)];
        const opts = shuffleWithPrng([itm.ans, ...itm.wrg], prng);

        question = {
          id: `l${levelNum}_${difficulty}_q${q}`,
          question: itm.q,
          category: 'pengetahuan',
          visualEmoji: itm.em,
          options: opts,
          correctAnswer: itm.ans,
          explanation: `Jawaban tepat adalah "${itm.ans}".`,
        };
      }
    }

    questions.push(question);
  }

  return {
    levelNumber: levelNum,
    title: `Level ${levelNum}`,
    ageGroup,
    theme,
    questions,
  };
}
