// =========================================================
// scripts/setup.js
// ---------------------------------------------------------
// Setup login dalam SATU langkah, tanpa copy-paste manual.
// Jalankan: npm run setup
//
// Script ini akan menanyakan username & password admin,
// lalu otomatis:
//   1. Membuat hash bcrypt dari password (password asli TIDAK disimpan)
//   2. Membuat SESSION_SECRET acak
//   3. Menulis semuanya langsung ke file .env
// Setelah ini selesai, "npm start" langsung bisa dipakai login,
// tidak perlu langkah manual lain.
// =========================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const bcrypt = require('bcryptjs');

const ENV_PATH = path.join(__dirname, '..', '.env');
const ENV_EXAMPLE_PATH = path.join(__dirname, '..', '.env.example');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

// Sembunyikan input password di terminal (ganti karakter jadi *)
function askHidden(query) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(query);
    let input = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (char) => {
      char = char.toString();
      if (char === '\n' || char === '\r' || char === '\u0004') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(input);
        return;
      }
      if (char === '\u0003') { process.exit(1); } // Ctrl+C
      if (char === '\u007f') { input = input.slice(0, -1); return; } // backspace
      input += char;
      process.stdout.write('*');
    };
    stdin.on('data', onData);
  });
}

async function main() {
  console.log('=== Setup Login Admin — Portofolio ===');
  console.log('Ini cuma perlu dijalankan sekali. Isi username & password admin kamu.\n');

  let username = (await ask('Username admin: ')).trim();
  while (!username) {
    username = (await ask('Username tidak boleh kosong. Username admin: ')).trim();
  }

  let password = await askHidden('Password admin (minimal 6 karakter): ');
  while (!password || password.length < 6) {
    password = await askHidden('Terlalu pendek. Password admin (minimal 6 karakter): ');
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const sessionSecret = crypto.randomBytes(32).toString('hex');

  // Mulai dari .env.example kalau .env belum ada, supaya komentar penjelasan tetap ada.
  let base = fs.existsSync(ENV_PATH)
    ? fs.readFileSync(ENV_PATH, 'utf-8')
    : (fs.existsSync(ENV_EXAMPLE_PATH) ? fs.readFileSync(ENV_EXAMPLE_PATH, 'utf-8') : '');

  base = setEnvValue(base, 'ADMIN_USERNAME', username);
  base = setEnvValue(base, 'ADMIN_PASSWORD_HASH', passwordHash);
  base = setEnvValue(base, 'SESSION_SECRET', sessionSecret);
  if (!/^PORT=/m.test(base)) base = `PORT=3000\n` + base;
  if (!/^DATA_DIR=/m.test(base)) base += `\nDATA_DIR=./data\n`;

  fs.writeFileSync(ENV_PATH, base, 'utf-8');

  console.log('\n✅ Selesai! File .env sudah dibuat otomatis.');
  console.log(`   Username: ${username}`);
  console.log('   Password: (tersimpan sebagai hash, tidak ditulis ulang di sini)');
  console.log('\nSekarang tinggal jalankan:  npm start');
  console.log('Lalu login lewat halaman:   /login.html\n');
  rl.close();
}

// Ganti nilai KEY=... kalau sudah ada barisnya, atau tambahkan baris baru kalau belum.
function setEnvValue(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  return content.trim() + `\n${line}\n`;
}

main();
