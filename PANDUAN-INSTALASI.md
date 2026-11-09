# Lumina Learn — Panduan Instalasi
## Backend: Google Apps Script  •  Frontend: GitHub Pages

Panduan ini untuk memasang Lumina Learn dengan **dua bagian terpisah**:

| Bagian | Tempat | Isinya | Anda dapat |
|---|---|---|---|
| **Backend** | Google Apps Script | `Kode.gs` (satu berkas) — REST API, database Google Sheets, file di Google Drive | URL berakhiran `/exec` |
| **Frontend** | GitHub Pages | folder `lumina-learn/` (`index.html`, `css/`, `js/`) | URL `https://USERNAME.github.io/lumina-learn/` |

```
Pengunjung ──► GitHub Pages (tampilan)  ──fetch──►  Apps Script /exec (API JSON) ──► Google Sheets + Drive
```

Total waktu: ±30–45 menit pertama kali. **Urutan wajib:** A (persiapan) → B (backend) → C (frontend) → D (uji).

---

## A. Persiapan (5 menit)

Putuskan **dua nama** dulu, karena dipakai di dua tempat:

1. **Username GitHub** Anda — misalnya `budiguru`. (Belum punya? Daftar gratis di https://github.com.)
2. **Nama repository** — saran: `lumina-learn` (huruf kecil, tanpa spasi).

Dari dua nama itu, alamat situs Anda nanti sudah pasti:

```
https://USERNAME.github.io/NAMA-REPO/        contoh: https://budiguru.github.io/lumina-learn/
```

Catat alamat ini (**pakai garis miring di akhir**). Anda akan menempelkannya di langkah B2.

Yang Anda terima dari saya:

| Berkas | Dipakai untuk |
|---|---|
| `Kode.gs` | Backend → ditempel ke editor Apps Script (Bagian B) |
| `lumina-learn-frontend.zip` | Frontend → diekstrak lalu di-push ke GitHub (Bagian C) |
| `PANDUAN-INSTALASI.md` | Panduan ini |

---

## B. Backend — Google Apps Script

### B1. Buat proyek dan tempel kode
1. Buka https://script.google.com → **New project** (Proyek baru). Pastikan masuk dengan akun Google yang akan menjadi **pemilik data** (spreadsheet dan folder Drive akan dibuat di akun ini, dan akun ini menjadi **Super Admin**).
2. Klik nama proyek di kiri atas → beri nama, misalnya `Lumina Learn API`.
3. Di berkas `Code.gs` bawaan: hapus semua isinya, lalu tempel seluruh isi **`Kode.gs`**.
4. Klik ikon 💾 **Save**.

> Hanya **satu berkas** ini yang dibutuhkan. Tidak ada berkas HTML di Apps Script pada versi ini.

### B2. Isi alamat frontend (penting untuk email "Lupa sandi")
Di bagian paling atas `Kode.gs`, cari baris:

```javascript
const FRONTEND_URL = '';
```

Isi dengan alamat dari Bagian A:

```javascript
const FRONTEND_URL = 'https://budiguru.github.io/lumina-learn/';
```

Simpan lagi (💾). Alamat ini dipakai untuk tautan di email reset sandi. Jika dikosongkan, Anda harus mengisinya lewat **Settings → Public site URL** setelah login; selama belum terisi, fitur "Forgot password" menampilkan pesan "not available yet".

### B3. Jalankan setup (SEKALI)
1. Di bilah atas editor, pilih fungsi **`setupAppEnvironment`** dari dropdown → klik ▶ **Run**.
2. Muncul "Authorization required" → **Review permissions** → pilih akun Anda → jika ada peringatan "Google hasn't verified this app": **Advanced** → **Go to Lumina Learn API (unsafe)** → **Allow**. (Wajar: ini skrip milik Anda sendiri.)
3. Tunggu beberapa detik. Buka **Execution log** (di bawah). Anda akan melihat:

```
✅ Setup selesai.
📁 Folder      : https://drive.google.com/...
📊 Spreadsheet : https://docs.google.com/...
👤 Super Admin : emailanda@gmail.com
🔑 Sandi awal  : Admin-xxxxxx!   ← segera ganti ...
```

4. **Catat email Super Admin dan sandi awal** (muncul sekali, di log ini).
5. Cek Google Drive: ada folder `LuminaLearn_App`, berisi spreadsheet `DB_LuminaLearn` (sheet sudah terisi 4 kelas contoh).

Aman dijalankan ulang (tidak membuat duplikat), tetapi tidak perlu.

### B4. Pasang pemanas server (disarankan)
Pilih fungsi **`installWarmupTrigger`** → ▶ **Run**. Ini memasang pemicu otomatis tiap 30 menit yang menyegarkan cache sehingga halaman publik lebih cepat dimuat.

### B5. Deploy sebagai Web App
1. Klik **Deploy** (kanan atas) → **New deployment**.
2. Klik ikon ⚙️ di samping "Select type" → pilih **Web app**.
3. Isi:
   - **Description:** `v1`
   - **Execute as:** **Me** (akun Anda)
   - **Who has access:** **Anyone** ← wajib. Bukan "Anyone with Google account", bukan "Only myself".
4. Klik **Deploy** → (izinkan lagi bila diminta) → salin **Web app URL**, bentuknya:
   `https://script.google.com/macros/s/AKfycb.........../exec`
5. **Tes backend:** tempel URL itu di tab browser baru. Harus tampil teks JSON seperti:

```
{"success":true,"data":{"app":"Lumina Learn","api":"ok","time":1760000000000},"message":"OK"}
```

   Lalu tambahkan `?fn=getPublicData` di ujung URL → tampil JSON panjang berisi kelas-kelas contoh. Jika ini berhasil, **backend siap**. Simpan URL `/exec` untuk Bagian C.

> **Jika yang tampil halaman login Google atau "Sorry, unable to open the file":** pengaturan akses belum **Anyone**. Deploy → **Manage deployments** → ✏️ → ubah "Who has access" → **Deploy**.

---

## C. Frontend — GitHub Pages

> Bagian ini memakai **terminal**. Jangan memakai tombol "Upload files" di web GitHub — itu meratakan struktur folder dan membuat CSS/JS tidak ditemukan (404).

### C1. Pasang Git (lewati jika sudah ada)
- **Windows:** unduh dari https://git-scm.com/download/win → install dengan pengaturan default. Lalu buka **PowerShell** dari menu Start.
- **Mac:** buka Terminal, ketik `git --version` (macOS akan menawarkan instalasi bila belum ada).
- **Linux:** `sudo apt install git`.

Cek:
```bash
git --version
```
Harus muncul nomor versi (contoh `git version 2.45.0`).

### C2. Identitas Git (sekali per komputer)
```bash
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@contoh.com"
```
(`user.name` bebas; hanya label di riwayat. Email sebaiknya sama dengan email akun GitHub.)

### C3. Buat repository kosong di GitHub
1. Login github.com → tombol **+** (kanan atas) → **New repository**.
2. **Repository name:** `lumina-learn` (harus sama dengan yang Anda pakai di Bagian A).
3. Pilih **Public**. (GitHub Pages gratis hanya untuk repo publik. Aman: isinya tidak memuat rahasia.)
4. **Jangan** centang "Add a README", ".gitignore", atau "license".
5. Klik **Create repository**. Biarkan halaman hasilnya terbuka.

### C4. Ekstrak ZIP dan siapkan folder kerja
1. Ekstrak `lumina-learn-frontend.zip` (klik kanan → Extract All). Windows biasanya membuat folder bungkus bernama `lumina-learn-frontend` yang berisi **satu folder bernama `lumina-learn`**. Yang dipakai adalah folder **`lumina-learn` yang di dalam**.
2. Buka folder `lumina-learn` itu. Di dalamnya langsung terlihat:

```
lumina-learn\
├── index.html
├── README.md
├── PANDUAN-INSTALASI.md
├── .nojekyll        (berkas tersembunyi; tidak apa-apa bila tidak terlihat)
├── css\style.css
└── js\ config.js · app.js
```

> ⚠️ **Folder `lumina-learn` inilah satu-satunya folder yang akan di-`git init`.** Bukan folder induknya (mis. `Downloads`), bukan juga subfolder `css` atau `js`.

### C5. Isi `js/config.js` (SEBELUM push pertama)
Buka `js\config.js` dengan Notepad/VS Code. Ganti `XXXX` dengan URL `/exec` dari langkah B5:

```javascript
window.LL_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycb.........../exec',
  SITE_URL: ''
};
```

- Pakai tanda kutip tunggal, jangan ada spasi di dalam URL, URL harus utuh sampai `/exec`.
- `SITE_URL` biarkan kosong (diisi otomatis dari alamat situs).
- Simpan berkas. Ini **satu-satunya** berkas yang perlu Anda edit.

### C6. Masuk ke folder dan verifikasi (jangan dilewati)
**Windows:** buka folder `lumina-learn` di File Explorer → klik address bar → ketik `powershell` → Enter. PowerShell terbuka tepat di folder itu.
**Mac/Linux:** `cd` ke folder tersebut, misalnya `cd ~/Downloads/lumina-learn`.

Lihat isinya:
```powershell
dir          # Windows PowerShell
ls -la       # Mac / Linux / Git Bash
```
**Wajib terlihat:** `index.html`, folder `css`, folder `js`. Jika yang terlihat malah folder lain (mis. `lumina-learn` lagi di dalamnya), masuk satu level dengan `cd lumina-learn` dan cek ulang. **Jangan lanjut sebelum `index.html` terlihat di daftar.** Git tidak akan memprotes jika folder salah; hasilnya situs 404.

### C7. Push pertama kali (satu per satu)
```bash
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/lumina-learn.git
git push -u origin main
```
- Ganti `USERNAME` dengan username GitHub Anda. Ada **titik** setelah `git add`.
- `git add .` dan `git branch -M main` tidak menampilkan apa-apa (itu normal).
- Saat `git push` meminta **Username**: isi username GitHub. **Password**: isi **Personal Access Token** (bukan password akun) — lihat C8. Saat mengetik/paste token **layar tampak kosong; itu normal**. Paste lalu Enter.
- Berhasil jika muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

Peringatan `LF will be replaced by CRLF` boleh diabaikan.

### C8. Membuat Personal Access Token (hanya jika diminta / ditolak)
1. Buka https://github.com/settings/tokens → **Generate new token** → **Generate new token (classic)**.
2. **Note:** `git-push`. **Expiration:** 90 days (atau No expiration).
3. Centang scope **repo**. Klik **Generate token**.
4. **Salin token (`ghp_...`)** — hanya tampil sekali. Simpan sementara di Notepad.
5. Ulangi `git push -u origin main`, paste token sebagai password.

(Alternatif visual tanpa terminal: **GitHub Desktop** → Add Local Repository → pilih folder `lumina-learn` → Publish repository.)

### C9. Aktifkan GitHub Pages
1. Buka `https://github.com/USERNAME/lumina-learn` → pastikan terlihat `index.html`, `css`, `js` di daftar berkas.
2. Tab **Settings** → menu kiri **Pages**.
3. **Source:** *Deploy from a branch*. **Branch:** `main` dan folder `/ (root)` → **Save**.
4. Tunggu 1–3 menit, muat ulang halaman Settings → Pages. Muncul: *"Your site is live at https://USERNAME.github.io/lumina-learn/"*. Centang **Enforce HTTPS** bila tersedia.
5. Buka alamat itu. Layar sempat menampilkan "Loading…" (pertama kali bisa 3–8 detik karena server Apps Script "bangun"), lalu beranda Lumina Learn tampil dengan kelas-kelas contoh.

---

## D. Uji menyeluruh (10 menit)

Lakukan berurutan:

1. **Beranda tampil** dengan 4 kelas contoh. Muat ulang: kali ini muncul langsung (cache lokal).
2. **Login Super Admin:** Log in → email & sandi awal dari log B3 → masuk ke *Admin dashboard*.
3. **Settings** (menu kiri) → isi **Brand name**, logo, tanda tangan sertifikat, **Public site URL** (isi alamat situs GitHub Pages) → **Save**.
4. **Daftar sebagai member** di jendela *Incognito*: Sign up → pilih kelas → **Request Enrollment**.
5. Kembali ke admin → **Members → Enrollments → Activate**.
6. Member: muat ulang → kelas muncul di *My Learning* → selesaikan pelajaran → kerjakan kuis modul → hasil langsung tampil.
7. Setelah semua modul selesai dan rata-rata ≥ nilai minimal (default 70) → **sertifikat terbit otomatis** → tombol **Download PDF** / **Print**.
8. **Verifikasi sertifikat:** salin tautan verifikasi dari halaman sertifikat, buka di tab baru → muncul "Valid certificate".
9. **Lupa sandi:** Log in → Forgot password → masukkan email → cek email → klik tautan → harus membuka situs Anda (bukan halaman JSON) → set sandi baru.

Jika langkah apa pun gagal, buka **F12 → Console** dan **Network**, lalu lihat tabel masalah di bawah.

---

## E. Memperbarui di kemudian hari

### Mengubah frontend (tampilan / config.js)
Dari folder `lumina-learn`:
```bash
git add .
git commit -m "Deskripsi perubahan"
git push
```
Tunggu 1–2 menit. Jika masih tampil versi lama: **Ctrl+Shift+R** atau jendela Incognito.

### Mengubah backend (`Kode.gs`)
1. Tempel kode baru di editor Apps Script → Save.
2. **Deploy → Manage deployments → ✏️ (edit) → Version: *New version* → Deploy.**
3. **Jangan** memilih "New deployment": itu membuat URL `/exec` baru dan Anda harus mengubah `config.js` + push ulang. Dengan "Manage deployments → New version", **URL tetap sama**.

### Mengganti kelas/materi/anggota
Semua dari panel admin di situs. Tidak perlu menyentuh kode.

---

## F. Masalah umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| Layar "We could not load the app … not connected to its server" | `API_URL` di `js/config.js` masih `XXXX` / kosong / salah | Isi URL `/exec` yang benar → `git add . && git commit -m "config" && git push` |
| "Network error…" saat membuka situs | URL `/exec` salah, atau akses deployment bukan **Anyone**, atau tidak ada internet | Tes URL `/exec` langsung di browser (harus tampil JSON). Perbaiki akses di Manage deployments |
| Console: *blocked by CORS policy* | Deployment bukan **Anyone**, atau memakai URL lama/`/dev` | Gunakan URL yang berakhiran `/exec` dari deployment akses **Anyone** |
| Muncul halaman login Google saat membuka URL `/exec` | Akses deployment belum **Anyone** | Manage deployments → ubah → Deploy (New version) |
| Setelah ubah `Kode.gs`, perubahan tidak berlaku | Belum membuat versi baru | Manage deployments → ✏️ → New version → Deploy |
| JSON berisi `"Unknown action."` | Frontend dan backend beda versi | Pastikan `Kode.gs` terbaru sudah di-deploy (New version) dan `app.js` terbaru sudah di-push |
| "Forgot password" → "not available yet" | `FRONTEND_URL` / *Public site URL* belum diisi | Isi di `Kode.gs` (B2) lalu deploy New version, atau lewat Settings sebagai Super Admin |
| Tautan di email reset membuka halaman JSON | Alamat salah di `FRONTEND_URL`/Public site URL | Isi dengan alamat **GitHub Pages**, bukan URL `/exec` |
| Situs 404 di GitHub Pages | `index.html` tidak berada di root repo (push dari folder induk) | Buka repo di github.com: jika terlihat folder `lumina-learn/` di root, ulangi dari dalam folder itu (`cd lumina-learn`, `git init`, …, `git push -u origin main --force`) |
| Halaman tampil polos tanpa gaya, console 404 pada `.css`/`.js` | Struktur folder rata (upload via web) | Ulangi push lewat terminal dari folder yang benar |
| `Password authentication is not supported` saat push | GitHub menolak password akun | Buat token (C8) dan pakai sebagai password |
| `remote origin already exists` | Sudah pernah `git remote add` | Lewati; atau `git remote set-url origin <url>` |
| `Updates were rejected` | Repo GitHub sudah berisi berkas (mis. README) | `git pull --rebase origin main` lalu `git push` |
| Email reset tidak sampai | Kuota email harian Apps Script (±100/hari akun gratis) atau masuk Spam | Cek folder Spam; tunggu reset kuota; admin dapat menyetel ulang sandi member lewat tombol reset di panel Members |
| Pertama kali buka lambat 3–8 detik | *Cold start* Apps Script | Normal setelah lama tidak dipakai. Cache lokal membuat kunjungan berikutnya langsung tampil; `installWarmupTrigger` membantu |
| Unduh PDF sertifikat gagal | Library PDF (CDN) diblokir jaringan | Gunakan **Print → Save as PDF** |

---

## G. Catatan keamanan & batasan

- Repo **Public** aman: berisi tampilan dan URL API saja. **Tidak ada** sandi, token, atau ID sheet. Rahasia (pepper hash sandi, kunci token) tersimpan di **Script Properties** Apps Script.
- URL `/exec` pada dasarnya publik (siapa pun bisa memanggilnya). Data tetap aman karena setiap aksi member/admin butuh **token login**, sandi di-hash bergaram, ada pembatasan percobaan login, dan kunci jawaban kuis tidak pernah dikirim ke browser.
- Hanya fungsi yang terdaftar pada tabel `ROUTES_` di `Kode.gs` yang bisa dipanggil dari internet; fungsi setup (`setupAppEnvironment`, dst.) **tidak** dapat dipicu lewat web.
- Jangan membagikan sandi awal Super Admin; ganti segera lewat **Forgot password**.
- Batasan Apps Script: tiap permintaan ±1–3 detik; kuota email harian; ± 30 eksekusi bersamaan. Untuk skala awal (4 kelas × ±20 member) lebih dari cukup. Tampilan dirancang agar tetap terasa instan (cache lokal, pembaruan di latar belakang).
- **Mengganti akun pemilik:** data berada di Drive akun pembuat. Jangan menghapus folder `LuminaLearn_App` / spreadsheet `DB_LuminaLearn`.

---

## H. (Opsional) Domain sendiri / Blogger

- **Domain sendiri:** GitHub → Settings → Pages → *Custom domain*; atur DNS sesuai petunjuk GitHub. Setelah itu ubah `FRONTEND_URL` (Kode.gs, deploy New version) dan *Public site URL* di Settings ke alamat domain baru.
- **Blogger:** disarankan menautkan saja ke alamat GitHub Pages. Memasangnya sebagai iframe di Blogger bisa dilakukan, tetapi browser modern membatasi penyimpanan lokal di dalam iframe lintas-situs sehingga login bisa tidak bertahan.

---

## Ringkasan 10 langkah

1. Putuskan username GitHub + nama repo → catat alamat situs.
2. Apps Script: proyek baru → tempel `Kode.gs`.
3. Isi `FRONTEND_URL` → Save.
4. Run `setupAppEnvironment` → catat sandi awal → Run `installWarmupTrigger`.
5. Deploy Web app (Me / Anyone) → salin URL `/exec` → tes di browser.
6. Ekstrak ZIP → edit `js/config.js` (isi `API_URL`).
7. Buka terminal **di dalam folder `lumina-learn`** → `dir` harus menampilkan `index.html`.
8. `git init` → `add` → `commit` → `branch -M main` → `remote add` → `push`.
9. GitHub Settings → Pages → `main` / root → Save.
10. Buka situs → uji alur (Bagian D).
