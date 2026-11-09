# Lumina Learn — Frontend (GitHub Pages)

Frontend statis (HTML + CSS + JavaScript murni) untuk platform belajar online **Lumina Learn**.
Semua data dan logika server ada di backend Google Apps Script (REST API); repositori ini hanya berisi tampilan.

```
index.html        ← halaman utama (satu-satunya halaman; navigasi berjalan di sisi browser)
css/style.css     ← seluruh gaya (terang & gelap)
js/config.js      ← ✏️ SATU-SATUNYA berkas yang perlu diedit: isi API_URL
js/app.js         ← seluruh logika aplikasi
.nojekyll         ← memberi tahu GitHub Pages untuk menyajikan berkas apa adanya
```

## Cara pakai singkat
1. Deploy backend Apps Script → salin URL `/exec`.
2. Edit `js/config.js` → tempel URL tadi di `API_URL`.
3. Push ke GitHub → aktifkan Pages (branch `main`, folder `/ (root)`).

Panduan lengkap langkah demi langkah: lihat `PANDUAN-INSTALASI.md`.

> Repositori ini aman dibuat **Public**: tidak ada kata sandi, token, atau rahasia di dalamnya.
> URL API memang bersifat publik; keamanan data dijaga oleh login (token) di sisi server.
