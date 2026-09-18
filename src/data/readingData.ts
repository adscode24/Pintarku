import { ReadingItem } from '../types';

export const VOWELS_CONSONANTS: ReadingItem[] = [
  { id: 'v_a', type: 'letter', display: 'A a', emoji: '🍎', audioText: 'Huruf A. Apel.', meaning: 'Apel' },
  { id: 'v_i', type: 'letter', display: 'I i', emoji: '🐟', audioText: 'Huruf I. Ikan.', meaning: 'Ikan' },
  { id: 'v_u', type: 'letter', display: 'U u', emoji: '🦐', audioText: 'Huruf U. Udang.', meaning: 'Udang' },
  { id: 'v_e', type: 'letter', display: 'E e', emoji: '🦅', audioText: 'Huruf E. Elang.', meaning: 'Elang' },
  { id: 'v_o', type: 'letter', display: 'O o', emoji: '🔥', audioText: 'Huruf O. Obor.', meaning: 'Obor' },
  { id: 'c_b', type: 'letter', display: 'B b', emoji: '⚽', audioText: 'Huruf B. Bola.', meaning: 'Bola' },
  { id: 'c_c', type: 'letter', display: 'C c', emoji: '🍒', audioText: 'Huruf C. Ceri.', meaning: 'Ceri' },
  { id: 'c_d', type: 'letter', display: 'D d', emoji: '🍃', audioText: 'Huruf D. Daun.', meaning: 'Daun' },
  { id: 'c_g', type: 'letter', display: 'G g', emoji: '🐘', audioText: 'Huruf G. Gajah.', meaning: 'Gajah' },
  { id: 'c_k', type: 'letter', display: 'K k', emoji: '🐱', audioText: 'Huruf K. Kucing.', meaning: 'Kucing' },
  { id: 'c_m', type: 'letter', display: 'M m', emoji: '🚗', audioText: 'Huruf M. Mobil.', meaning: 'Mobil' },
  { id: 'c_s', type: 'letter', display: 'S s', emoji: '🐮', audioText: 'Huruf S. Sapi.', meaning: 'Sapi' },
];

export const SYLLABLE_SETS = [
  { group: 'B', items: ['ba', 'bi', 'bu', 'be', 'bo'], emoji: '⚽' },
  { group: 'C', items: ['ca', 'ci', 'cu', 'ce', 'co'], emoji: '🍒' },
  { group: 'D', items: ['da', 'di', 'du', 'de', 'do'], emoji: '🍃' },
  { group: 'G', items: ['ga', 'gi', 'gu', 'ge', 'go'], emoji: '🐘' },
  { group: 'H', items: ['ha', 'hi', 'hu', 'he', 'ho'], emoji: '💖' },
  { group: 'K', items: ['ka', 'ki', 'ku', 'ke', 'ko'], emoji: '🐱' },
  { group: 'L', items: ['la', 'li', 'lu', 'le', 'lo'], emoji: '🍋' },
  { group: 'M', items: ['ma', 'mi', 'mu', 'me', 'mo'], emoji: '🚗' },
  { group: 'N', items: ['na', 'ni', 'nu', 'ne', 'no'], emoji: '🍍' },
  { group: 'P', items: ['pa', 'pi', 'pu', 'pe', 'po'], emoji: '🍌' },
  { group: 'R', items: ['ra', 'ri', 'ru', 're', 'ro'], emoji: '🏡' },
  { group: 'S', items: ['sa', 'si', 'su', 'se', 'so'], emoji: '🐮' },
  { group: 'T', items: ['ta', 'ti', 'tu', 'te', 'to'], emoji: '🧢' },
];

export const READING_WORDS: ReadingItem[] = [
  { id: 'rw_1', type: 'word', display: 'BUKU', syllables: ['BU', 'KU'], emoji: '📖', audioText: 'Buku. B U bu, K U ku, buku.', meaning: 'Benda untuk membaca dan belajar' },
  { id: 'rw_2', type: 'word', display: 'BOLA', syllables: ['BO', 'LA'], emoji: '⚽', audioText: 'Bola. B O bo, L A la, bola.', meaning: 'Mainan bundar untuk ditendang' },
  { id: 'rw_3', type: 'word', display: 'KUCING', syllables: ['KU', 'CING'], emoji: '🐱', audioText: 'Kucing. K U ku, C I N G cing, kucing.', meaning: 'Hewan lucu berbulu' },
  { id: 'rw_4', type: 'word', display: 'APEL', syllables: ['A', 'PEL'], emoji: '🍎', audioText: 'Apel. A, P E L pel, apel.', meaning: 'Buah manis berwarna merah' },
  { id: 'rw_5', type: 'word', display: 'MOBIL', syllables: ['MO', 'BIL'], emoji: '🚗', audioText: 'Mobil. M O mo, B I L bil, mobil.', meaning: 'Kendaraan roda empat' },
  { id: 'rw_6', type: 'word', display: 'RUMAH', syllables: ['RU', 'MAH'], emoji: '🏡', audioText: 'Rumah. R U ru, M A H mah, rumah.', meaning: 'Tempat tinggal keluarga' },
  { id: 'rw_7', type: 'word', display: 'POHON', syllables: ['PO', 'HON'], emoji: '🌳', audioText: 'Pohon. P O po, H O N hon, pohon.', meaning: 'Tumbuhan rindang berkayu' },
  { id: 'rw_8', type: 'word', display: 'IKAN', syllables: ['I', 'KAN'], emoji: '🐟', audioText: 'Ikan. I, K A N kan, ikan.', meaning: 'Hewan yang hidup di air' },
  { id: 'rw_9', type: 'word', display: 'SAPI', syllables: ['SA', 'PI'], emoji: '🐮', audioText: 'Sapi. S A sa, P I pi, sapi.', meaning: 'Hewan pemakan rumput penghasil susu' },
  { id: 'rw_10', type: 'word', display: 'TOPI', syllables: ['TO', 'PI'], emoji: '🧢', audioText: 'Topi. T O to, P I pi, topi.', meaning: 'Penutup kepala agar tidak kepanasan' },
  { id: 'rw_11', type: 'word', display: 'BUNGA', syllables: ['BU', 'NGA'], emoji: '🌸', audioText: 'Bunga. B U bu, N G A nga, bunga.', meaning: 'Tanaman cantik berwarna-warni' },
  { id: 'rw_12', type: 'word', display: 'DONAT', syllables: ['DO', 'NAT'], emoji: '🍩', audioText: 'Donat. D O do, N A T nat, donat.', meaning: 'Kue bundar dengan lubang di tengah' },
  { id: 'rw_13', type: 'word', display: 'PISANG', syllables: ['PI', 'SANG'], emoji: '🍌', audioText: 'Pisang. P I pi, S A N G sang, pisang.', meaning: 'Buah manis kesukaan monyet' },
  { id: 'rw_14', type: 'word', display: 'GAJAH', syllables: ['GA', 'JAH'], emoji: '🐘', audioText: 'Gajah. G A ga, J A H jah, gajah.', meaning: 'Hewan berbadan besar dan belalai panjang' },
  { id: 'rw_15', type: 'word', display: 'BINTANG', syllables: ['BIN', 'TANG'], emoji: '⭐', audioText: 'Bintang. B I N bin, T A N G tang, bintang.', meaning: 'Benda langit yang bersinar di malam hari' },
  { id: 'rw_16', type: 'word', display: 'KERETA', syllables: ['KE', 'RE', 'TA'], emoji: '🚂', audioText: 'Kereta. K E ke, R E re, T A ta, kereta.', meaning: 'Kendaraan panjang di atas rel' },
  { id: 'rw_17', type: 'word', display: 'SEPEDA', syllables: ['SE', 'PE', 'DA'], emoji: '🚲', audioText: 'Sepeda. S E se, P E pe, D A da, sepeda.', meaning: 'Kendaraan roda dua yang dikayuh' },
  { id: 'rw_18', type: 'word', display: 'JERUK', syllables: ['JE', 'RUK'], emoji: '🍊', audioText: 'Jeruk. J E je, R U K ruk, jeruk.', meaning: 'Buah segar kaya vitamin C' },
];

export const READING_SENTENCES: ReadingItem[] = [
  { id: 's_1', type: 'sentence', display: 'Budi suka membaca buku cerita.', emoji: '👦📖', audioText: 'Budi suka membaca buku cerita.' },
  { id: 's_2', type: 'sentence', display: 'Ibu memasak sup ayam yang enak.', emoji: '👩🍲', audioText: 'Ibu memasak sup ayam yang enak.' },
  { id: 's_3', type: 'sentence', display: 'Kucing kecil bermain bola merah di taman.', emoji: '🐱⚽', audioText: 'Kucing kecil bermain bola merah di taman.' },
  { id: 's_4', type: 'sentence', display: 'Ayah mengantar adik pergi ke sekolah.', emoji: '👨🎒', audioText: 'Ayah mengantar adik pergi ke sekolah.' },
  { id: 's_5', type: 'sentence', display: 'Burung bernyanyi merdu di atas ranting pohon.', emoji: '🐦🌳', audioText: 'Burung bernyanyi merdu di atas ranting pohon.' },
  { id: 's_6', type: 'sentence', display: 'Matahari pagi bersinar terang dan hangat.', emoji: '☀️🌻', audioText: 'Matahari pagi bersinar terang dan hangat.' },
  { id: 's_7', type: 'sentence', display: 'Siti menyiram bunga mawar setiap sore.', emoji: '👧🌷', audioText: 'Siti menyiram bunga mawar setiap sore.' },
  { id: 's_8', type: 'sentence', display: 'Kita harus rajin belajar agar pintar.', emoji: '⭐🎓', audioText: 'Kita harus rajin belajar agar pintar dan cerdas.' },
];
