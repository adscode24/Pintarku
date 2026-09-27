# Panduan Kompilasi Native Android APK Menggunakan GitHub Cloud (GitHub Actions)

Aplikasi **Anak Pintar** adalah aplikasi native Android berbasis Capacitor yang 100% identik dengan kode sumber (bukan PWA, melainkan Native APK dengan runtime Android WebView, splash screen native, icon adaptive Android, dan plugin native).

---

## 🚀 Mengapa Menggunakan GitHub Cloud?
Kompilasi APK Native Android membutuhkan:
- Java OpenJDK 21
- Android SDK (API 34/35) & Android Build Tools
- Gradle Compiler
- Dalvik/ART Bytecode compiler (D8 / AAPT2)

Dengan **GitHub Cloud (GitHub Actions)**, seluruh lingkungan Android SDK dan Java sudah disediakan secara gratis oleh server cloud Ubuntu GitHub Runner, sehingga proses kompilasi menjadi otomatis, cepat, dan menghasilkan file APK asli (`.apk`) tanpa perlu repot menginstal ratusan gigabyte tools di komputer lokal.

---

## 🛠️ Langkah-langkah Kompilasi via GitHub Cloud:

### 1. Inisialisasi & Hubungkan ke Repository GitHub Anda
Buka terminal pada proyek ini dan jalankan perintah berikut (ganti `USERNAME` dan `REPO-NAME` dengan akun GitHub Anda):

```bash
# Tambahkan remote repository GitHub Anda
git remote add origin https://github.com/USERNAME/REPO-NAME.git

# Pastikan branch utama bernama main
git branch -M main

# Tambahkan seluruh berkas dan commit
git add .
git commit -m "feat: setup native android capacitor and github cloud apk builder"

# Push ke GitHub
git push -u origin main
```

---

### 2. Proses Kompilasi Otomatis Berjalan di GitHub Cloud
1. Buka halaman repository Anda di peramban web: `https://github.com/USERNAME/REPO-NAME`.
2. Klik tab **Actions** di bilah navigasi atas.
3. Anda akan melihat alur kerja bernama:
   **"Build Native Android APK (GitHub Cloud)"** sedang berjalan secara otomatis (simbol kuning berputar).
4. GitHub Cloud akan menjalankan:
   - ✅ Setup Node.js 22 (LTS) & install dependencies
   - ✅ Compile kode sumber web frontend (`vite build`)
   - ✅ Sinkronisasi Capacitor native bridge (`cap sync android`)
   - ✅ Setup OpenJDK 21 & Android SDK Platform Tools (API 35)
   - ✅ Eksekusi Gradle: `./gradlew assembleDebug assembleRelease`
   - ✅ Memaketkan file APK Native yang ditandatangani.

---

### 3. Mengunduh File APK Native
1. Saat alur kerja selesai (ditandai dengan centang hijau), klik judul alur kerja tersebut.
2. Gulir ke bawah ke bagian **Artifacts**.
3. Klik dan unduh arsip **`AnakPintar-Native-APK`**.
4. Di dalamnya terdapat file:
   - **`AnakPintar-release.apk`**: File APK rilis siap pasang langsung di HP atau Tablet Android.
   - **`AnakPintar-debug.apk`**: File APK debug untuk pengujian langsung.

---

### 4. Memasang APK di Perangkat Android
1. Kirim file `AnakPintar-release.apk` ke HP/Tablet Android Anda (via WhatsApp, Telegram, Google Drive, atau kabel data).
2. Ketuk file APK untuk memulai instalasi.
3. Jika muncul konfirmasi *“Izinkan pemasangan dari sumber ini”*, aktifkan izin tersebut.
4. Tekan **Pasang / Install**.
5. Aplikasi **Anak Pintar** kini terpasang sebagai aplikasi native penuh di HP/Tablet Android Anda!

---

## 📦 Pilihan Alternatif: Kompilasi Lokal dengan Android Studio
Jika Anda memiliki Android Studio di komputer:
1. Buka Android Studio.
2. Pilih **Open** -> buka folder `android/` di dalam direktori proyek ini.
3. Tunggu proses Gradle Sync selesai.
4. Buka menu **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5. File APK akan terbentuk di folder `android/app/build/outputs/apk/release/app-release.apk`.
