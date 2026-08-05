# Portofolio Pribadi — Web CRUD + Login Admin

Website portofolio dengan halaman publik (biografi, riwayat belajar, riwayat
kerja, pencapaian, project) dan dashboard admin ber-CRUD penuh, hanya bisa
diakses oleh pemilik lewat login.

## Tech Stack

- **Backend:** Node.js + Express
- **"Database":** file JSON tunggal (`data/data.json`) — sengaja tidak pakai
  SQLite/MySQL yang butuh native module, supaya build di Railway **tidak
  pernah gagal** karena masalah compile.
- **Auth:** session (`express-session`) + password di-hash pakai `bcryptjs`
  (pure JavaScript, bukan native module).
- **Frontend:** HTML/CSS/JS murni (tanpa framework), font Plus Jakarta Sans +
  Inter, ikon Lucide.

## Struktur Folder

```
portfolio-app/
├── server.js              # entry point
├── src/
│   ├── db.js               # baca/tulis data.json
│   ├── auth-middleware.js  # cek status login
│   ├── routes-auth.js      # login, logout, cek sesi
│   ├── routes-public.js    # data untuk halaman publik
│   ├── routes-admin.js     # CRUD (wajib login)
│   └── hash-helper.js      # bikin hash password
├── public/
│   ├── index.html           # halaman publik
│   ├── login.html           # halaman login (TIDAK ditautkan di manapun)
│   ├── admin.html           # dashboard admin
│   ├── css/style.css
│   └── js/ (main.js, login.js, admin.js)
├── .env.example
└── package.json
```

## 🔐 Cara Login (baca ini baik-baik)

Tidak ada tombol/link "Login" di halaman manapun. Untuk masuk ke dashboard,
buka URL berikut secara langsung di browser:

```
https://domain-kamu.com/login.html
```

Username & password **kamu tentukan sendiri** lewat environment variable
(`ADMIN_USERNAME` dan `ADMIN_PASSWORD_HASH`) — lihat langkah setup di bawah.
Tidak ada password default/bawaan dari template ini.

## 🖥️ Setup di Komputer Lokal

1. Install dependency:
   ```bash
   npm install
   ```

2. Setup login admin (satu perintah, otomatis bikin `.env` lengkap):
   ```bash
   npm run setup
   ```
   Tinggal masukkan username & password yang kamu mau. Script ini otomatis
   generate hash password + session secret, lalu langsung menulis semuanya
   ke file `.env` — tidak perlu copy-paste manual lagi.

3. Jalankan server:
   ```bash
   npm start
   ```

4. Buka:
   - Halaman publik: http://localhost:3000
   - Halaman login: http://localhost:3000/login.html

> Cara lama (`npm run hash` lalu isi `.env` manual) masih tersedia kalau kamu
> lebih suka atur satu-satu — tapi untuk kebanyakan kasus `npm run setup` sudah cukup.

## 🚂 Deploy ke Railway (langkah demi langkah)

Ikuti urutan ini persis supaya deploy **tidak gagal**:

### 1. Push project ke GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <url-repo-github-kamu>
git push -u origin main
```
Pastikan `.env` **tidak ikut ter-push** (sudah otomatis diabaikan lewat
`.gitignore` — cek dulu dengan `git status` sebelum commit).

### 2. Buat project baru di Railway
1. Login ke [railway.app](https://railway.app), klik **New Project**.
2. Pilih **Deploy from GitHub repo**, lalu pilih repo kamu.
3. Railway otomatis mendeteksi ini project Node.js (lewat `package.json`)
   dan akan menjalankan `npm install` lalu `npm start` — tidak perlu
   konfigurasi build tambahan.

### 3. Set Environment Variables
Di dashboard Railway, buka tab **Variables**, tambahkan satu per satu:

| Key | Value |
|---|---|
| `ADMIN_USERNAME` | username pilihan kamu |
| `ADMIN_PASSWORD_HASH` | hasil dari `npm run setup` (lihat isi `.env` lokal kamu) |
| `SESSION_SECRET` | string acak panjang (jangan sama dengan contoh di `.env.example`) |
| `NODE_ENV` | `production` |
| `DATA_DIR` | `/data` (lihat langkah 4, WAJIB pakai Volume) |

> ⚠️ **Kesalahan paling umum:** lupa set salah satu dari `ADMIN_USERNAME`
> atau `ADMIN_PASSWORD_HASH` di Railway. Kalau lupa, login akan selalu
> gagal dengan pesan "konfigurasi server belum lengkap".

### 4. Tambahkan Volume (WAJIB — supaya data tidak hilang)

Railway menghapus seluruh filesystem setiap kali app di-redeploy. Kalau
`data.json` disimpan di folder biasa, **semua isi CRUD kamu akan hilang**
setiap kali kamu push update baru. Untuk mencegah ini:

1. Di dashboard Railway, buka service kamu → tab **Volumes**.
2. Klik **New Volume**.
3. Set **Mount Path** menjadi `/data` (harus sama persis dengan value
   env `DATA_DIR` yang kamu set di langkah 3).
4. Redeploy service.

Sekarang `data.json` kamu tersimpan permanen di Volume, aman dari redeploy.

### 5. Generate domain publik
Di tab **Settings** → **Networking**, klik **Generate Domain**. Railway akan
kasih URL publik seperti `nama-project.up.railway.app`. Otomatis HTTPS.

### 6. Cek hasil deploy
- Buka domain Railway kamu → harus muncul halaman portofolio publik.
- Tambahkan `/login.html` di belakang URL → coba login dengan
  `ADMIN_USERNAME` & password asli (bukan hash) yang tadi kamu buat hash-nya.
- Kalau berhasil masuk ke dashboard, tambahkan data lewat form, lalu cek
  apakah muncul di halaman publik.

### Troubleshooting Railway

| Gejala | Kemungkinan Penyebab | Solusi |
|---|---|---|
| Build gagal / crash saat start | Environment variable belum lengkap | Cek lagi tab Variables, pastikan `ADMIN_USERNAME` & `ADMIN_PASSWORD_HASH` sudah ada |
| Login selalu "username atau password salah" | Salah generate hash, atau ada spasi tak sengaja ke-copy | Jalankan ulang `npm run hash`, copy hasilnya hati-hati (jangan ada spasi di awal/akhir) |
| Data hilang setiap redeploy | Volume belum dipasang / `DATA_DIR` tidak sesuai mount path | Ulangi langkah 4, pastikan `DATA_DIR` = mount path Volume persis sama |
| Halaman blank/504 | App belum selesai start / crash loop | Cek tab **Deployments** → **View Logs** di Railway untuk lihat error aslinya |

## 🌐 Soal Netlify

Netlify dibuat untuk hosting **static site** (HTML/CSS/JS murni) dan tidak
menjalankan server Node.js/Express secara langsung seperti Railway. Karena
project ini punya backend (login, CRUD, file `data.json`), **Netlify sendirian
tidak cukup** untuk project ini.

Kalau tetap ingin pakai Netlify, opsinya:
- Deploy backend (folder ini) ke **Railway** seperti panduan di atas, lalu
- Deploy folder `public/` saja ke Netlify sebagai frontend terpisah, dan
  ubah semua `fetch('/api/...')` di `main.js`/`login.js`/`admin.js` menjadi
  URL lengkap ke backend Railway kamu, misalnya:
  `fetch('https://nama-project.up.railway.app/api/public/all')`

Untuk pemula, **disarankan pakai Railway saja** untuk backend + frontend
sekaligus (lebih simpel, satu tempat, tidak perlu atur CORS).

## Menambah Field Baru (belajar mengembangkan sendiri)

Semua data disimpan sebagai objek/array biasa di `data/data.json`. Untuk
menambah field baru (misalnya "linkedin_url" di biografi):
1. Tambahkan `<input name="linkedin_url">` di form terkait (`admin.html`).
2. Tidak perlu ubah backend — `routes-admin.js` otomatis menyimpan semua
   field yang dikirim dari form (lihat komentar `Object.assign`/spread di
   file tersebut).
3. Tampilkan di `index.html` + `main.js` kalau mau muncul di halaman publik.

## Catatan Keamanan

- Password admin tidak pernah disimpan dalam bentuk asli, hanya hash bcrypt.
- Session cookie diset `httpOnly` (tidak bisa dicuri lewat JavaScript) dan
  `secure` saat production (hanya dikirim lewat HTTPS).
- Halaman `/login.html` dan `/admin.html` diberi `<meta name="robots"
  content="noindex, nofollow">` supaya tidak diindeks Google.
- Ini tetap project skala personal/belajar — untuk aplikasi dengan data
  sensitif/banyak pengguna, pertimbangkan database sungguhan (PostgreSQL)
  dan rate-limiting untuk endpoint login.
