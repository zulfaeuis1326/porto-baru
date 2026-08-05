// =========================================================
// login.js
// ---------------------------------------------------------
// Menangani submit form login: kirim username & password ke
// /api/auth/login. Kalau sukses, redirect ke /admin.html.
// =========================================================

const form = document.getElementById('login-form');
const errorBox = document.getElementById('error-box');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.remove('show');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Memproses...';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      errorBox.textContent = data.error || 'Login gagal.';
      errorBox.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk';
      return;
    }

    // Login sukses -> arahkan ke dashboard admin
    window.location.href = '/admin.html';
  } catch (err) {
    errorBox.textContent = 'Tidak bisa terhubung ke server. Coba lagi.';
    errorBox.classList.add('show');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Masuk';
  }
});
