// =========================================================
// routes-public.js
// ---------------------------------------------------------
// Endpoint yang boleh diakses SIAPA SAJA tanpa login, karena
// isinya cuma data untuk ditampilkan di halaman portofolio
// (index.html). Tidak ada operasi tulis/ubah/hapus di sini.
// =========================================================

const express = require('express');
const { readDB } = require('./db');
const router = express.Router();

// GET /api/public/all
// Mengembalikan semua data sekaligus (biografi, riwayat, dst)
// supaya index.html cukup 1x fetch saja, tidak berkali-kali.
router.get('/all', (req, res) => {
  const db = readDB();
  res.json({
    biografi: db.biografi,
    riwayat_belajar: db.riwayat_belajar,
    riwayat_kerja: db.riwayat_kerja,
    pencapaian: db.pencapaian,
    projects: db.projects
  });
});

module.exports = router;
