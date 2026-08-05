// =========================================================
// auth-middleware.js
// ---------------------------------------------------------
// "Middleware" adalah fungsi yang dijalankan SEBELUM sebuah
// route diproses. Di sini kita pakai untuk mengecek: apakah
// orang yang request ini sudah login atau belum?
//
// Kalau sudah login (ada session.isLoggedIn === true), request
// dilanjutkan ke route tujuan (next()).
// Kalau belum, kita tolak dengan status 401 (Unauthorized) —
// ini yang bikin data admin TIDAK BISA diakses orang lain
// walaupun mereka tahu URL /api/admin/... nya.
// =========================================================

function requireAuth(req, res, next) {
  if (req.session && req.session.isLoggedIn) {
    return next();
  }
  return res.status(401).json({ error: 'Belum login. Silakan login dulu.' });
}

module.exports = { requireAuth };
