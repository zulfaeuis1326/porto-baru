// =========================================================
// server.js
// ---------------------------------------------------------
// Entry point aplikasi. Ini file yang dijalankan pertama kali
// ("npm start" -> "node server.js").
// =========================================================

require('dotenv').config(); // baca file .env (kalau ada) ke process.env

const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const { requireAuth } = require('./src/auth-middleware');
const authRoutes = require('./src/routes-auth');
const publicRoutes = require('./src/routes-public');
const adminRoutes = require('./src/routes-admin');

const app = express();

// Railway (dan hosting lain) mengatur PORT lewat environment variable.
// Kalau tidak ada (misalnya saat development di komputer sendiri), pakai 3000.
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------
// Middleware dasar
// ---------------------------------------------------------
app.use(express.json()); // supaya req.body bisa baca JSON dari fetch()
app.use(cookieParser());

// express-session: menyimpan status "sudah login" di server,
// browser hanya menyimpan cookie berisi ID session (bukan datanya).
app.use(session({
  secret: process.env.SESSION_SECRET || 'ganti_secret_ini_sebelum_deploy',
  resave: false,
  saveUninitialized: false,
  cookie: {
    // secure: true artinya cookie cuma dikirim lewat HTTPS.
    // Railway & Netlify otomatis pakai HTTPS, jadi aman diaktifkan
    // saat production. Saat development lokal (http://localhost)
    // kita matikan supaya login tetap bisa dites.
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // cookie tidak bisa diakses lewat JavaScript di browser (mencegah XSS mencuri session)
    maxAge: 1000 * 60 * 60 * 8 // session bertahan 8 jam
  }
}));

// ---------------------------------------------------------
// Serve file statis (HTML, CSS, JS) dari folder /public
// ---------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------
// API Routes
// ---------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);

// Semua route di bawah /api/admin WAJIB login dulu.
// requireAuth dipasang di sini (bukan di tiap route satu-satu)
// supaya tidak ada satupun endpoint admin yang lupa dilindungi.
app.use('/api/admin', requireAuth, adminRoutes);

// ---------------------------------------------------------
// Fallback: kalau ada request ke path yang tidak dikenal API,
// arahkan ke index.html (berguna kalau nanti kamu kembangkan
// jadi single-page app). Untuk sekarang cukup jaga-jaga saja.
// ---------------------------------------------------------
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
  console.log(`Halaman login ada di /login.html (tidak ditautkan di navigasi manapun)`);

  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) {
    console.log('\n⚠️  Login admin belum di-setup. Jalankan perintah ini dulu (sekali saja):');
    console.log('    npm run setup\n');
  }
});
