// =========================================================
// routes-admin.js
// ---------------------------------------------------------
// Semua endpoint di sini HANYA bisa diakses kalau sudah login
// (lihat: middleware requireAuth dipasang di server.js untuk
// semua route yang diawali /api/admin).
//
// Ada 2 jenis data:
// 1. "biografi"      -> cuma 1 objek (bukan list), jadi cuma ada GET & PUT (update)
// 2. "koleksi" lain  -> berupa list/array, jadi ada full CRUD:
//    riwayat_belajar, riwayat_kerja, pencapaian, projects
// =========================================================

const express = require('express');
const { readDB, writeDB, generateId } = require('./db');
const router = express.Router();

// ---------------------------------------------------------
// BIOGRAFI (singleton, tidak berupa list)
// ---------------------------------------------------------

// GET /api/admin/biografi
router.get('/biografi', (req, res) => {
  const db = readDB();
  res.json(db.biografi);
});

// PUT /api/admin/biografi
router.put('/biografi', (req, res) => {
  const db = readDB();
  // Object.assign menimpa field lama dengan field baru dari body request,
  // field yang tidak dikirim tetap dipertahankan nilai lamanya.
  db.biografi = { ...db.biografi, ...req.body };
  writeDB(db);
  res.json({ message: 'Biografi berhasil diperbarui.', data: db.biografi });
});

// ---------------------------------------------------------
// Helper generik untuk bikin CRUD 4 endpoint sekaligus
// (list, create, update, delete) untuk satu "koleksi" data.
// Daripada tulis kode yang sama berulang 4x untuk riwayat_belajar,
// riwayat_kerja, pencapaian, dan projects — kita bikin 1 fungsi
// yang dipakai ulang. Ini namanya prinsip DRY (Don't Repeat Yourself).
// ---------------------------------------------------------
function buatCrudRoutes(namaKoleksi) {
  const sub = express.Router();

  // GET /api/admin/<namaKoleksi>  -> ambil semua item
  sub.get('/', (req, res) => {
    const db = readDB();
    res.json(db[namaKoleksi]);
  });

  // POST /api/admin/<namaKoleksi>  -> tambah item baru
  sub.post('/', (req, res) => {
    const db = readDB();
    const itemBaru = {
      id: generateId(),
      ...req.body,
      dibuat_pada: new Date().toISOString()
    };
    db[namaKoleksi].push(itemBaru);
    writeDB(db);
    res.status(201).json({ message: 'Data berhasil ditambahkan.', data: itemBaru });
  });

  // PUT /api/admin/<namaKoleksi>/:id  -> edit item berdasarkan id
  sub.put('/:id', (req, res) => {
    const db = readDB();
    const index = db[namaKoleksi].findIndex((item) => item.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Data tidak ditemukan.' });
    }
    db[namaKoleksi][index] = { ...db[namaKoleksi][index], ...req.body };
    writeDB(db);
    res.json({ message: 'Data berhasil diperbarui.', data: db[namaKoleksi][index] });
  });

  // DELETE /api/admin/<namaKoleksi>/:id  -> hapus item berdasarkan id
  sub.delete('/:id', (req, res) => {
    const db = readDB();
    const panjangSebelum = db[namaKoleksi].length;
    db[namaKoleksi] = db[namaKoleksi].filter((item) => item.id !== req.params.id);
    if (db[namaKoleksi].length === panjangSebelum) {
      return res.status(404).json({ error: 'Data tidak ditemukan.' });
    }
    writeDB(db);
    res.json({ message: 'Data berhasil dihapus.' });
  });

  return sub;
}

// Pasang CRUD untuk masing-masing koleksi.
// Hasilnya: /api/admin/riwayat-belajar, /api/admin/riwayat-kerja,
//           /api/admin/pencapaian, /api/admin/projects
router.use('/riwayat-belajar', buatCrudRoutes('riwayat_belajar'));
router.use('/riwayat-kerja', buatCrudRoutes('riwayat_kerja'));
router.use('/pencapaian', buatCrudRoutes('pencapaian'));
router.use('/projects', buatCrudRoutes('projects'));

module.exports = router;
