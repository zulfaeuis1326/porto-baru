// =========================================================
// routes-auth.js
// ---------------------------------------------------------
// Semua endpoint yang berhubungan dengan login/logout.
// PENTING: tidak ada satupun tempat di UI publik yang
// menampilkan link/tombol ke halaman login. Halaman /login.html
// hanya bisa diakses kalau seseorang memang tahu URL-nya
// (info ini hanya ada di README, sesuai permintaan kamu).
// =========================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// POST /api/auth/login
// Body: { username, password }
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  const validUsername = process.env.ADMIN_USERNAME;
  const validPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!validUsername || !validPasswordHash) {
    // Ini artinya .env belum di-setup dengan benar di server.
    console.error('ADMIN_USERNAME / ADMIN_PASSWORD_HASH belum diset di environment variable!');
    return res.status(500).json({ error: 'Konfigurasi server belum lengkap. Hubungi pemilik web.' });
  }

  // Bandingkan username (case-sensitive, apa adanya)
  if (username !== validUsername) {
    // Sengaja pesan error-nya digeneralisir ("username atau password salah")
    // bukan "username tidak ditemukan" — supaya orang lain tidak bisa
    // menebak-nebak username yang benar lewat pesan error yang berbeda.
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  // bcrypt.compareSync membandingkan password yang diketik user
  // dengan hash yang tersimpan di .env, tanpa pernah men-decode hash-nya.
  const passwordCocok = bcrypt.compareSync(password, validPasswordHash);
  if (!passwordCocok) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  // Login sukses -> simpan status login di session.
  // express-session otomatis mengirim cookie berisi ID session
  // (bukan data login itu sendiri) ke browser.
  req.session.isLoggedIn = true;
  req.session.username = username;

  return res.json({ message: 'Login berhasil.', username });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal logout.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logout berhasil.' });
  });
});

// GET /api/auth/check
// Dipakai frontend untuk cek: user ini masih login atau tidak
// (misalnya saat admin.html pertama kali dibuka).
router.get('/check', (req, res) => {
  if (req.session && req.session.isLoggedIn) {
    return res.json({ loggedIn: true, username: req.session.username });
  }
  return res.json({ loggedIn: false });
});

module.exports = router;
