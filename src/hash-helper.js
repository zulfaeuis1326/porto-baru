// =========================================================
// hash-helper.js
// ---------------------------------------------------------
// Script bantuan untuk membuat hash password admin.
// Kita TIDAK PERNAH menyimpan password asli di mana pun (termasuk
// di kode maupun README) — yang disimpan cuma "hash"-nya, hasil
// satu arah dari algoritma bcrypt yang tidak bisa dibalik ke
// password asli.
//
// Cara pakai (jalankan dari root folder project):
//   npm run hash
// lalu ikuti instruksi yang muncul di terminal.
// =========================================================

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Generator Hash Password Admin ===');
rl.question('Masukkan password yang mau dipakai untuk login admin: ', (password) => {
  if (!password || password.length < 6) {
    console.log('\n⚠️  Password terlalu pendek. Minimal 6 karakter, coba lagi ya.');
    rl.close();
    return;
  }

  // Angka 10 di bawah = "salt rounds", makin tinggi makin aman tapi makin lambat.
  // 10 adalah nilai standar yang cukup aman untuk aplikasi personal.
  const hash = bcrypt.hashSync(password, 10);

  console.log('\n✅ Hash berhasil dibuat! Copy baris di bawah ini ke file .env kamu:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  console.log('Ingat: password ASLI tidak disimpan di mana pun. Simpan baik-baik ya,');
  console.log('kalau lupa, tinggal jalankan "npm run hash" lagi untuk buat hash baru.');

  rl.close();
});
