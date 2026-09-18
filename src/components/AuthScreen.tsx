import React, { useState } from 'react';
import { DifficultyLevel, UserAccountSummary, UserProfile } from '../types';
import { 
  getAllLocalUsers, 
  getLocalProfile, 
  createLocalUser, 
  deleteLocalUser, 
  setActiveUserId, 
  AVATAR_OPTIONS,
  exportAllLocalData,
  importLocalData 
} from '../utils/localAuth';
import { playSound, speakIndonesian } from '../utils/audio';
import { 
  UserPlus, 
  Star, 
  Lock, 
  ShieldCheck, 
  Trash2, 
  Download, 
  Upload, 
  Sparkles, 
  Check, 
  ArrowRight,
  SlidersHorizontal,
  KeyRound,
  X
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [users, setUsers] = useState<UserAccountSummary[]>(() => getAllLocalUsers());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [pinTargetUser, setPinTargetUser] = useState<UserAccountSummary | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // New User Form State
  const [newName, setNewName] = useState<string>('');
  const [newAvatar, setNewAvatar] = useState<string>('🦁');
  const [newAge, setNewAge] = useState<number>(7);
  const [newGrade, setNewGrade] = useState<string>('Kelas 1 SD');
  const [newDifficulty, setNewDifficulty] = useState<DifficultyLevel>('mudah');
  const [newPin, setNewPin] = useState<string>('');
  const [usePin, setUsePin] = useState<boolean>(false);

  // Backup / Import State
  const [backupMsg, setBackupMsg] = useState<string>('');

  const refreshUsers = () => {
    setUsers(getAllLocalUsers());
  };

  const handleSelectUser = (userSummary: UserAccountSummary) => {
    playSound('click');
    const fullProfile = getLocalProfile(userSummary.id);
    if (!fullProfile) return;

    if (fullProfile.pin && fullProfile.pin.length >= 4) {
      setPinTargetUser(userSummary);
      setEnteredPin('');
      setPinError('');
      speakIndonesian(`Masukkan PIN untuk ${userSummary.name}`);
    } else {
      setActiveUserId(fullProfile.id);
      playSound('victory');
      speakIndonesian(`Halo ${fullProfile.name}, selamat datang kembali!`);
      onLoginSuccess(fullProfile);
    }
  };

  const handleVerifyPin = (pinValue: string) => {
    if (!pinTargetUser) return;
    const fullProfile = getLocalProfile(pinTargetUser.id);
    if (!fullProfile) return;

    if (fullProfile.pin === pinValue) {
      setActiveUserId(fullProfile.id);
      playSound('victory');
      speakIndonesian(`Halo ${fullProfile.name}, PIN benar!`);
      onLoginSuccess(fullProfile);
    } else {
      playSound('wrong');
      setPinError('PIN salah, silakan coba lagi ya!');
      setEnteredPin('');
      speakIndonesian('PIN salah, coba lagi.');
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    playSound('pop');
    const created = createLocalUser({
      name: newName,
      avatar: newAvatar,
      age: newAge,
      grade: newGrade,
      difficulty: newDifficulty,
      pin: usePin && newPin.length >= 4 ? newPin : undefined,
    });

    setShowAddModal(false);
    refreshUsers();
    speakIndonesian(`Selamat datang ${created.name}! Ayo kita mulai belajar!`);
    onLoginSuccess(created);
  };

  const handleDeleteUser = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Apakah Anda yakin ingin menghapus profil ${name}? Semua skor belajar anak ini akan dihapus dari HP.`)) {
      playSound('click');
      deleteLocalUser(id);
      refreshUsers();
    }
  };

  const handleExportBackup = () => {
    playSound('click');
    const dataStr = exportAllLocalData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cadangan-BintangPintar-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupMsg('File cadangan data tersimpan di HP!');
    setTimeout(() => setBackupMsg(''), 4000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = importLocalData(content);
      if (ok) {
        playSound('victory');
        refreshUsers();
        setBackupMsg('Data berhasil dipulihkan!');
      } else {
        playSound('wrong');
        setBackupMsg('Gagal memulihkan: format file tidak cocok.');
      }
      setTimeout(() => setBackupMsg(''), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div id="auth-screen" className="min-h-screen bg-gradient-to-b from-indigo-600 via-purple-600 to-amber-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border-4 border-indigo-200 flex flex-col gap-5 animate-fade-in my-auto">
        {/* App Branding */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg border-2 border-white ring-4 ring-amber-200">
            ⭐
          </div>
          <h1 className="text-2xl font-fredoka font-bold text-slate-800">
            Anak Pintar
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Media Belajar Membaca, Menulis & Berhitung Anak 6-10 Tahun
          </p>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h2 className="font-fredoka font-bold text-slate-800 text-base">
              Siapa yang Belajar Hari Ini?
            </h2>
            <p className="text-[11px] text-slate-400">
              Pilih akun profil anak untuk melanjutkan
            </p>
          </div>
          <button
            id="btn-add-profile-header"
            onClick={() => { playSound('pop'); setShowAddModal(true); }}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-fredoka font-bold text-xs rounded-xl flex items-center gap-1 border border-indigo-200 transition-all active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Akun Baru</span>
          </button>
        </div>

        {/* User Profiles Grid */}
        <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
          {users.map((u) => (
            <div
              key={u.id}
              id={`user-card-${u.id}`}
              onClick={() => handleSelectUser(u)}
              className="group relative p-3 bg-gradient-to-r from-amber-50/70 to-orange-50/70 hover:from-amber-100/90 hover:to-orange-100/90 border-2 border-amber-200 hover:border-amber-400 rounded-2xl cursor-pointer transition-all flex items-center justify-between shadow-xs active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-amber-200 flex items-center justify-center text-2xl flex-shrink-0">
                  {u.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-fredoka font-bold text-slate-800 text-base leading-tight">
                      {u.name}
                    </h3>
                    {u.hasPin && <Lock className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {u.age} thn ({u.grade})
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold uppercase ${
                      u.difficulty === 'mudah' ? 'bg-emerald-100 text-emerald-800' :
                      u.difficulty === 'sedang' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {u.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-xl border border-amber-200 text-xs font-bold text-amber-600 shadow-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{u.totalStars}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteUser(u.id, u.name, e)}
                  title="Hapus profil"
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs">
              Belum ada profil anak. Silakan ketuk tombol "+ Akun Baru" di atas.
            </div>
          )}
        </div>

        {/* Security & Local Phone Storage Guarantee */}
        <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-emerald-900 leading-relaxed">
            <p className="font-bold text-emerald-950">100% Tersimpan di Memori HP:</p>
            Seluruh data akun, bintang, lencana, dan skor kuis tersimpan aman langsung di perangkat ini tanpa memerlukan koneksi internet ataupun server eksternal.
          </div>
        </div>

        {/* Data Backup & Restore Controls */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1 text-indigo-600 hover:underline font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cadangkan Data</span>
            </button>
            <span>•</span>
            <label className="flex items-center gap-1 text-indigo-600 hover:underline font-semibold cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Pulihkan Data</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
          {backupMsg && (
            <span className="text-[10px] font-bold text-emerald-600">{backupMsg}</span>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD NEW CHILD PROFILE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-4 border-indigo-200 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-fredoka font-bold text-slate-800 text-lg">
                Tambah Profil Anak Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-3 text-xs">
              {/* Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Panggilan Anak:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti / Budi / Fajar"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 font-fredoka font-bold text-sm outline-none"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Karakter Favorit:</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => { playSound('click'); setNewAvatar(av); }}
                      className={`text-2xl p-1.5 rounded-xl border-2 transition-all ${
                        newAvatar === av
                          ? 'border-indigo-600 bg-indigo-50 scale-110'
                          : 'border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age and Grade */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Usia:</label>
                  <select
                    value={newAge}
                    onChange={(e) => {
                      const age = Number(e.target.value);
                      setNewAge(age);
                      if (age <= 7) setNewGrade('Kelas 1 SD');
                      else if (age === 8) setNewGrade('Kelas 2 SD');
                      else if (age === 9) setNewGrade('Kelas 3 SD');
                      else setNewGrade('Kelas 4 SD');
                    }}
                    className="w-full p-2 rounded-xl border-2 border-slate-200 font-bold outline-none"
                  >
                    <option value={6}>6 Tahun</option>
                    <option value={7}>7 Tahun</option>
                    <option value={8}>8 Tahun</option>
                    <option value={9}>9 Tahun</option>
                    <option value={10}>10 Tahun</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tingkat Kelas:</label>
                  <input
                    type="text"
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full p-2 rounded-xl border-2 border-slate-200 font-bold outline-none"
                  />
                </div>
              </div>

              {/* Difficulty Level Option */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Tingkat Kesulitan:</span>
                  <span className="text-[10px] text-indigo-600">Dapat diubah kapan saja</span>
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setNewDifficulty('mudah')}
                    className={`py-1.5 px-2 rounded-xl font-fredoka font-bold text-xs border ${
                      newDifficulty === 'mudah'
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Mudah (1-10)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDifficulty('sedang')}
                    className={`py-1.5 px-2 rounded-xl font-fredoka font-bold text-xs border ${
                      newDifficulty === 'sedang'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Sedang (1-25)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDifficulty('sulit')}
                    className={`py-1.5 px-2 rounded-xl font-fredoka font-bold text-xs border ${
                      newDifficulty === 'sulit'
                        ? 'bg-rose-500 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Sulit (1-100)
                  </button>
                </div>
              </div>

              {/* Optional PIN */}
              <div className="pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePin}
                    onChange={(e) => setUsePin(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="font-bold text-slate-700">Kunci profil dengan PIN 4 Angka (Opsional)</span>
                </label>
                {usePin && (
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Masukkan 4 angka PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full mt-1.5 p-2 rounded-xl border-2 border-slate-200 font-mono tracking-widest text-center text-base"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-fredoka font-bold rounded-xl shadow-md"
                >
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PIN KEYPAD PROMPT */}
      {pinTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border-4 border-indigo-200 flex flex-col items-center gap-3 animate-scale-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-2xl flex items-center justify-center">
              {pinTargetUser.avatar}
            </div>
            <div>
              <h3 className="font-fredoka font-bold text-slate-800 text-base">
                Masukkan PIN {pinTargetUser.name}
              </h3>
              <p className="text-[11px] text-slate-400">
                Profil ini dilindungi dengan 4 angka PIN
              </p>
            </div>

            {/* PIN Dots */}
            <div className="flex gap-3 my-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 ${
                    enteredPin.length > idx
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'border-slate-300'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <p className="text-xs font-bold text-rose-600 animate-shake">
                {pinError}
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 w-full pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((keyVal) => (
                <button
                  key={String(keyVal)}
                  onClick={() => {
                    playSound('click');
                    if (keyVal === 'C') {
                      setEnteredPin('');
                      setPinError('');
                    } else if (keyVal === 'OK') {
                      handleVerifyPin(enteredPin);
                    } else {
                      if (enteredPin.length < 4) {
                        const next = enteredPin + keyVal;
                        setEnteredPin(next);
                        if (next.length === 4) {
                          handleVerifyPin(next);
                        }
                      }
                    }
                  }}
                  className="py-3 bg-slate-100 hover:bg-indigo-50 active:bg-indigo-100 rounded-xl font-fredoka font-bold text-base text-slate-700 transition-all active:scale-95 shadow-xs"
                >
                  {keyVal}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setPinTargetUser(null); setEnteredPin(''); }}
              className="mt-1 text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Kembali ke Pilih Akun
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
