import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  X,
  FileArchive,
  Share2,
  Check,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Info,
  ExternalLink
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface DownloadApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadApkModal: React.FC<DownloadApkModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'apk' | 'guide' | 'project'>('apk');

  if (!isOpen) return null;

  const appUrl = window.location.href;

  const handleCopyLink = () => {
    playSound('click');
    navigator.clipboard?.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = (filename: string) => {
    playSound('pop');
    // Direct link to the download file
    const link = document.createElement('a');
    link.href = `/downloads/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none font-['Quicksand',sans-serif]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSound('click');
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border-4 border-amber-200 animate-scale-up">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4 text-white relative shrink-0">
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white active:scale-90 transition-all"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner border border-white/30">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-emerald-100 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Android APK Package</span>
              </div>
              <h2 className="font-fredoka text-xl font-bold leading-tight">
                Unduh Aplikasi Android
              </h2>
            </div>
          </div>

          {/* Quick tab switcher */}
          <div className="flex bg-black/15 p-1 rounded-xl mt-3 text-xs font-fredoka font-bold">
            <button
              onClick={() => { playSound('click'); setActiveTab('apk'); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                activeTab === 'apk'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              📲 File APK
            </button>
            <button
              onClick={() => { playSound('click'); setActiveTab('guide'); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                activeTab === 'guide'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              📖 Cara Pasang
            </button>
            <button
              onClick={() => { playSound('click'); setActiveTab('project'); }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                activeTab === 'project'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              📦 Source Proyek
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-slate-700 text-sm">
          {/* TAB 1: APK DOWNLOAD */}
          {activeTab === 'apk' && (
            <div className="space-y-3.5">
              {/* Main APK Box */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 p-4 rounded-2xl border-2 border-emerald-200 shadow-xs">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-xs">
                      📱
                    </div>
                    <div>
                      <h3 className="font-fredoka font-bold text-slate-800 text-base leading-tight">
                        Anak Pintar v1.0.0
                      </h3>
                      <p className="text-xs text-slate-500">
                        Format: <span className="font-mono font-bold text-emerald-700">.APK</span> • Android 7.0+
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Siap Pasang
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Pasang langsung di smartphone atau tablet Android Anda. Aplikasi berjalan mandiri, cepat, dan nyaman tanpa gangguan browser.
                </p>

                {/* Primary Download Button */}
                <button
                  id="btn-download-apk-direct"
                  onClick={() => handleDownload('AnakPintar.apk')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-98 text-white font-fredoka font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-5 h-5 animate-bounce" />
                  <span>Download Berkas APK (AnakPintar.apk)</span>
                </button>
              </div>

              {/* Install PWA Alternative Badge */}
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 flex items-start gap-2.5">
                <div className="p-1.5 bg-amber-200/80 rounded-xl text-amber-800 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-fredoka font-bold text-amber-900 leading-tight">
                    Alternatif Pasang Instan (Tanpa File APK):
                  </p>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                    Buka menu browser Chrome di HP Anda (titik 3 di kanan atas), lalu pilih <strong className="text-amber-800 font-semibold">"Tambahkan ke Layar Utama"</strong> atau <strong className="text-amber-800 font-semibold">"Install Aplikasi"</strong>.
                  </p>
                </div>
              </div>

              {/* Share / Copy link for phone */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-500">Tautan Aplikasi untuk HP:</p>
                  <p className="text-xs text-slate-700 truncate font-mono">{appUrl}</p>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 active:scale-95 transition-all flex items-center gap-1 shrink-0 shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Salin Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: INSTALLATION GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 flex items-center gap-2 text-xs text-blue-900">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <span>
                  File APK aman dan dibuat khusus untuk aplikasi edukasi Anak Pintar.
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Step 1 */}
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-fredoka font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-fredoka font-bold text-slate-800 text-xs">
                      Download Berkas APK
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Tekan tombol <strong>"Download Berkas APK"</strong> di tab File APK. Berkas <code className="text-emerald-700 bg-emerald-50 px-1 rounded">AnakPintar.apk</code> akan tersimpan di HP.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-fredoka font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-fredoka font-bold text-slate-800 text-xs">
                      Buka File yang Diunduh
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Tarik bilah notifikasi HP Anda dan klik berkas yang selesai diunduh, atau cari melalui aplikasi <strong>Pengelola Berkas (File Manager) &gt; Download</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-fredoka font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-fredoka font-bold text-slate-800 text-xs">
                      Izinkan Sumber Tidak Dikenal
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Jika muncul jendela peringatan sistem Android, klik <strong>"Setelan" (Settings)</strong> lalu aktifkan <strong>"Izinkan dari sumber ini" (Allow from this source)</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-fredoka font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-fredoka font-bold text-slate-800 text-xs">
                      Pasang & Buka Aplikasi
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Tekan tombol <strong>"Pasang" (Install)</strong>. Setelah selesai, ikon <strong>Anak Pintar</strong> akan muncul di daftar aplikasi HP Anda dan siap dimainkan!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANDROID PROJECT SOURCE */}
          {activeTab === 'project' && (
            <div className="space-y-3">
              <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200">
                <div className="flex items-center gap-2.5 mb-2">
                  <FileArchive className="w-5 h-5 text-purple-600" />
                  <h4 className="font-fredoka font-bold text-slate-800 text-sm">
                    Source Project Android Studio (.zip)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Cocok untuk developer atau pengguna yang ingin membuka proyek lengkap di <strong>Android Studio</strong>, melakukan kustomisasi kode, menandatangani keystore rilis, atau menerbitkan ke Google Play Store.
                </p>

                <button
                  id="btn-download-project-zip"
                  onClick={() => handleDownload('AnakPintar-Android-Project.zip')}
                  className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 active:scale-98 text-white font-fredoka font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Proyek Android Studio (ZIP)</span>
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <p className="font-fredoka font-bold text-slate-700">Cara Compile Mandiri:</p>
                <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1">
                  <li>Ekstrak file ZIP yang diunduh.</li>
                  <li>Buka folder di <strong>Android Studio</strong>.</li>
                  <li>Pilih menu <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Capacitor &amp; Android Ready</span>
          </div>

          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 font-fredoka font-bold text-xs rounded-xl transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
