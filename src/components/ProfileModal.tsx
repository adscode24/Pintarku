import React, { useState } from 'react';
import { DifficultyLevel, UserProfile } from '../types';
import { playSound } from '../utils/audio';
import { X, User, Award, Star, BookOpen, Check, LogOut, SlidersHorizontal, Lock } from 'lucide-react';

interface ProfileModalProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onSwitchAccount: () => void;
  onClose: () => void;
}

const AVATARS = [
  { id: 'lion', emoji: '🦁', name: 'Singa Berani' },
  { id: 'rabbit', emoji: '🐰', name: 'Kelinci Pintar' },
  { id: 'cat', emoji: '🐱', name: 'Kucing Ceria' },
  { id: 'astronaut', emoji: '🚀', name: 'Astronot Cilik' },
  { id: 'bear', emoji: '🐻', name: 'Beruang Rajin' },
  { id: 'dino', emoji: '🦖', name: 'Dino Cerdas' },
  { id: 'panda', emoji: '🐼', name: 'Panda Santun' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn Ajaib' },
];

export default function ProfileModal({ userProfile, onUpdateProfile, onSwitchAccount, onClose }: ProfileModalProps) {
  const [name, setName] = useState(userProfile.name);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [age, setAge] = useState(userProfile.age);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(userProfile.difficulty || 'mudah');
  const [pin, setPin] = useState<string>(userProfile.pin || '');
  const [enablePin, setEnablePin] = useState<boolean>(Boolean(userProfile.pin && userProfile.pin.length >= 4));

  const handleSave = () => {
    playSound('pop');
    let grade = 'Kelas 1';
    if (age === 7) grade = 'Kelas 1 - 2';
    else if (age === 8) grade = 'Kelas 2 - 3';
    else if (age === 9) grade = 'Kelas 3 - 4';
    else if (age >= 10) grade = 'Kelas 4';

    onUpdateProfile({
      name: name.trim() || 'Adik Bintang',
      avatar,
      age,
      grade,
      difficulty,
      pin: enablePin && pin.length >= 4 ? pin : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border-4 border-indigo-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl p-1.5 bg-white/20 rounded-xl">
              {avatar}
            </div>
            <div>
              <h3 className="font-fredoka font-bold text-lg leading-tight">
                Profil Murid Pintar
              </h3>
              <p className="text-xs text-indigo-100">
                Atur nama, tingkat kesulitan & keamanan akun
              </p>
            </div>
          </div>

          <button
            onClick={() => { onClose(); playSound('click'); }}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Avatar Grid */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700">
              Pilih Karakter Favorit:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => { setAvatar(av.emoji); playSound('pop'); }}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-transform active:scale-95 ${
                    avatar === av.emoji
                      ? 'bg-amber-100 border-amber-500 scale-105 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-indigo-50'
                  }`}
                >
                  <span className="text-2xl">{av.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">
                    {av.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Child's Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Nama Panggilan:
            </label>
            <input
              type="text"
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama adik..."
              className="px-3.5 py-2.5 rounded-xl border-2 border-slate-200 font-fredoka font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Age Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Usia Anak (6 - 10 Tahun):
            </label>
            <div className="flex gap-1.5">
              {[6, 7, 8, 9, 10].map((a) => (
                <button
                  key={a}
                  onClick={() => { setAge(a); playSound('click'); }}
                  className={`flex-1 py-2 rounded-xl font-fredoka font-bold text-sm border-2 transition-all ${
                    age === a
                      ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50'
                  }`}
                >
                  {a} thn
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Setting */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                Tingkat Kesulitan Materi:
              </span>
              <span className="text-[10px] text-slate-400">Menyesuaikan angka & kata</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => { playSound('click'); setDifficulty('mudah'); }}
                className={`py-2 px-2 rounded-xl font-fredoka font-bold text-xs border-2 transition-all ${
                  difficulty === 'mudah'
                    ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-emerald-50'
                }`}
              >
                Mudah (1-10)
              </button>
              <button
                type="button"
                onClick={() => { playSound('click'); setDifficulty('sedang'); }}
                className={`py-2 px-2 rounded-xl font-fredoka font-bold text-xs border-2 transition-all ${
                  difficulty === 'sedang'
                    ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50'
                }`}
              >
                Sedang (1-25)
              </button>
              <button
                type="button"
                onClick={() => { playSound('click'); setDifficulty('sulit'); }}
                className={`py-2 px-2 rounded-xl font-fredoka font-bold text-xs border-2 transition-all ${
                  difficulty === 'sulit'
                    ? 'bg-rose-500 border-rose-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-rose-50'
                }`}
              >
                Sulit (1-100)
              </button>
            </div>
          </div>

          {/* Optional PIN Protection */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={enablePin}
                onChange={(e) => setEnablePin(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Kunci Akun Ini dengan PIN 4 Angka
              </span>
            </label>
            {enablePin && (
              <input
                type="password"
                maxLength={4}
                placeholder="4 angka PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="p-2 rounded-xl border border-slate-300 font-mono tracking-widest text-center text-sm font-bold bg-white"
              />
            )}
          </div>

          {/* Switch User / Ganti Akun Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchAccount();
              }}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-fredoka font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ganti Akun Murid</span>
            </button>
            <span className="text-[11px] text-slate-400">Data tersimpan di HP</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={() => { onClose(); playSound('click'); }}
            className="py-2 px-4 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-200"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-fredoka font-bold text-sm rounded-xl shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
}

