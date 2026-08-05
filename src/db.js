// =========================================================
// db.js
// ---------------------------------------------------------
// Ini adalah "database" kita. Alih-alih pakai SQLite/MySQL yang
// butuh compile native module (sering bikin build gagal di Railway
// untuk pemula), kita simpan semua data dalam SATU file JSON.
//
// Untuk skala website portofolio pribadi (data kecil, 1 admin),
// ini cukup cepat dan sangat gampang di-debug: tinggal buka
// data/data.json dan kamu bisa lihat langsung isi datanya.
//
// Kalau nanti project kamu makin besar, kamu tinggal ganti isi
// modul ini dengan koneksi PostgreSQL (Railway punya addon Postgres
// gratis) tanpa perlu ubah route-route lain, karena semua route
// hanya memanggil fungsi-fungsi di file ini (readDB, writeDB, dst).
// =========================================================

const fs = require('fs');
const path = require('path');

// DATA_DIR bisa diatur lewat environment variable.
// Di Railway, arahkan ini ke folder Volume (lihat README) supaya
// data tidak hilang setiap kali aplikasi di-redeploy.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'data.json');

// Struktur data default kalau file belum ada (pertama kali dijalankan)
const DEFAULT_DATA = {
  biografi: {
    nama: 'Nama Kamu',
    tagline: 'Mahasiswa Sistem Informasi | Web Developer',
    deskripsi: 'Tulis deskripsi singkat tentang dirimu di sini lewat halaman admin.',
    foto_url: '',
    email: '',
    lokasi: ''
  },
  riwayat_belajar: [],
  riwayat_kerja: [],
  pencapaian: [],
  projects: []
};

// Pastikan folder data ada. Kalau belum ada, buat dulu.
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Baca seluruh isi database dari file JSON.
// Kalau file belum ada, buat file baru dengan data default.
function readDB() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    writeDB(DEFAULT_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Kalau file corrupt/kosong, jangan sampai server crash.
    // Kembalikan data default sebagai fallback.
    console.error('data.json rusak/tidak valid, memakai data default:', err.message);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

// Tulis seluruh database ke file JSON.
// null, 2 di sini artinya file JSON di-format rapi (indentasi 2 spasi)
// supaya enak dibaca manusia kalau dibuka manual.
function writeDB(data) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Generate ID unik sederhana untuk item baru (riwayat, project, dll).
// Pakai timestamp + angka random supaya kemungkinan tabrakan sangat kecil.
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

module.exports = { readDB, writeDB, generateId, DB_FILE, DATA_DIR };
