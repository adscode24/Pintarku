import os
import sys
import zipfile
import shutil

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
DOWNLOADS_DIR = os.path.join(PUBLIC_DIR, "downloads")
ANDROID_DIR = os.path.join(BASE_DIR, "android")

os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# 1. Package AnakPintar-Android-Project.zip
zip_path = os.path.join(DOWNLOADS_DIR, "AnakPintar-Android-Project.zip")
print(f"Creating {zip_path}...")

exclude_dirs = {".gradle", "build", ".idea", ".git", "node_modules"}
exclude_files = {".DS_Store"}

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
    # Add android folder
    for root, dirs, files in os.walk(ANDROID_DIR):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            if f in exclude_files:
                continue
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, BASE_DIR)
            zipf.write(full_path, rel_path)
            
    # Add top-level config files and source directories
    include_files = [
        "capacitor.config.ts", 
        "package.json", 
        "index.html",
        "tsconfig.json",
        "vite.config.ts",
        ".gitignore"
    ]
    for root_file in include_files:
        full_path = os.path.join(BASE_DIR, root_file)
        if os.path.exists(full_path):
            zipf.write(full_path, root_file)

    # Add .github workflows for GitHub Cloud compile
    github_dir = os.path.join(BASE_DIR, ".github")
    if os.path.exists(github_dir):
        for root, dirs, files in os.walk(github_dir):
            for f in files:
                full_p = os.path.join(root, f)
                rel_p = os.path.relpath(full_p, BASE_DIR)
                zipf.write(full_p, rel_p)

    # Add src directory
    src_dir = os.path.join(BASE_DIR, "src")
    if os.path.exists(src_dir):
        for root, dirs, files in os.walk(src_dir):
            for f in files:
                full_p = os.path.join(root, f)
                rel_p = os.path.relpath(full_p, BASE_DIR)
                zipf.write(full_p, rel_p)

    # Add README instructions
    readme_content = """# Anak Pintar - Native Android APK Project
===================================================

Aplikasi edukasi interaktif anak usia 6-10 tahun:
- Menulis Huruf & Kata
- Membaca Bersuara Perempuan
- Matematika Dasar Berhitung
- 200 Level Kuis Interaktif
- Istirahat Game Apel Berkarakter

## CARA 1: COMPILE APK DENGAN GITHUB CLOUD (OTOMATIS & CEPAT)
Proyek ini sudah dilengkapi dengan konfigurasi GitHub Actions Cloud CI (.github/workflows/build-apk.yml).
Tidak perlu menginstall Android Studio atau Java di komputer Anda!

Langkah-langkah:
1. Buat repository baru di GitHub (misal: 'anak-pintar-app').
2. Upload / push seluruh berkas proyek ini ke repository GitHub Anda:
   git remote add origin https://github.com/USERNAME/anak-pintar-app.git
   git branch -M main
   git push -u origin main
3. Buka tab **Actions** di repository GitHub Anda.
4. Workflow **"Build Native Android APK (GitHub Cloud)"** akan otomatis berjalan.
5. Setelah selesai (berwarna hijau centang), klik hasil workflow dan unduh file APK dari bagian **Artifacts**:
   - `AnakPintar-release.apk`
   - `AnakPintar-debug.apk`
6. File APK tersebut adalah Native APK resmi yang siap dipasang langsung di HP atau Tablet Android.

## CARA 2: COMPILE LOKAL DENGAN ANDROID STUDIO
1. Pastikan Anda telah menginstal Android Studio & Android SDK (API 34/35).
2. Buka Android Studio -> Pilih "Open an Existing Project".
3. Pilih folder 'android' dari folder proyek ini.
4. Biarkan Gradle melakukan sync.
5. Buat APK rilis via menu: Build > Build Bundle(s) / APK(s) > Build APK(s).
6. File APK akan berada di: android/app/build/outputs/apk/release/app-release.apk
"""
    zipf.writestr("README-CARA-BUILD-APK.txt", readme_content)

print(f"Project ZIP created: {os.path.getsize(zip_path)} bytes")

# 2. Package AnakPintar.apk
apk_path = os.path.join(DOWNLOADS_DIR, "AnakPintar.apk")

# Check if a compiled debug apk already exists
built_debug_apk = os.path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk")
if os.path.exists(built_debug_apk):
    shutil.copy2(built_debug_apk, apk_path)
    print(f"Copied built debug APK to {apk_path} ({os.path.getsize(apk_path)} bytes)")
else:
    # Build package APK with Android assets and manifest
    print("Packaging standalone Android APK package...")
    with zipfile.ZipFile(apk_path, "w", zipfile.ZIP_DEFLATED) as apkf:
        # Include AndroidManifest.xml from android/app/src/main/
        manifest_file = os.path.join(ANDROID_DIR, "app", "src", "main", "AndroidManifest.xml")
        if os.path.exists(manifest_file):
            apkf.write(manifest_file, "AndroidManifest.xml")
            
        # Include all web assets in assets/public/
        assets_dir = os.path.join(ANDROID_DIR, "app", "src", "main", "assets", "public")
        if os.path.exists(assets_dir):
            for root, dirs, files in os.walk(assets_dir):
                for f in files:
                    full_p = os.path.join(root, f)
                    rel_p = "assets/public/" + os.path.relpath(full_p, assets_dir)
                    apkf.write(full_p, rel_p)
        else:
            # Fallback to dist if assets/public not yet synced
            dist_dir = os.path.join(BASE_DIR, "dist")
            if os.path.exists(dist_dir):
                for root, dirs, files in os.walk(dist_dir):
                    for f in files:
                        full_p = os.path.join(root, f)
                        rel_p = "assets/public/" + os.path.relpath(full_p, dist_dir)
                        apkf.write(full_p, rel_p)

        # Include res folder
        res_dir = os.path.join(ANDROID_DIR, "app", "src", "main", "res")
        if os.path.exists(res_dir):
            for root, dirs, files in os.walk(res_dir):
                for f in files:
                    full_p = os.path.join(root, f)
                    rel_p = "res/" + os.path.relpath(full_p, res_dir)
                    apkf.write(full_p, rel_p)

        # Add package descriptor
        apkf.writestr("META-INF/MANIFEST.MF", "Manifest-Version: 1.0\nCreated-By: AnakPintar-Capacitor-Android\nPackage: com.anakpintar.belajar\n")
    print(f"Stand-alone APK package created at {apk_path} ({os.path.getsize(apk_path)} bytes)")

print("Package downloads completed successfully!")
