# Kepatuhan Google Play — DigiLearn (Target: Anak 6–10 thn)

## Status kepatuhan kode (terpenuhi di repo)
- [x] Tanpa iklan, tanpa SDK analytics, tanpa pelacak (`package.json` bersih).
- [x] Hanya izin `INTERNET` (`android/app/src/main/AndroidManifest.xml`).
- [x] `targetSdkVersion 35`, `minSdkVersion 24` — sesuai syarat Play 2025+.
- [x] Rilis ditandatangani kunci upload (`pintarku-release.keystore`), format AAB.
- [x] Kebijakan privasi in-app (Profil → Kebijakan Privasi) + halaman publik
      `public/privacy-policy.html` (URL listing Play setelah deploy Vercel).
- [x] Kuota main game 15 menit + jeda 10 menit (fitur kesejahteraan anak).
- [x] Tombol keluar game yang jelas + tidak ada pembelian dalam aplikasi.

## Wajib diisi manual di Play Console (tidak bisa via kode)
1. **Target audience**: pilih 6–8 dan/atau 9–12. Maka otomatis masuk
   **Families Policy** — patuhi: tanpa iklan, tanpa link keluar tak terjaga,
   tanpa konten buatan pengguna, tanpa pembelian.
2. **Data safety form**: nyatakan "tidak mengumpulkan/membagikan data".
   Data profil anak hanya di `localStorage` perangkat (lihat PRIVACY_POLICY).
3. **Content rating** (kuesioner IARC): jawab jujur — konten edukasi, tanpa
   kekerasan/konten sensitif → rating Everyone.
4. **Listing**: ikon 512×512, feature graphic 1024×500, ≥2 screenshot HP,
   kategori Education, email kontak, URL privacy policy.
5. **Uji internal**: rilis track Internal testing dulu sebelum Production.

## Catatan Families Policy
- Jangan tambahkan WebView/link eksternal tanpa parental gate.
- Jangan tambahkan login sosial/analytics iklan di update berikutnya —
  ketiganya melanggar Families dan memicu penolakan review.
