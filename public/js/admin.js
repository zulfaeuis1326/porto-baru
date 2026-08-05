// =========================================================
// admin.js
// ---------------------------------------------------------
// Logika halaman dashboard admin:
// 1. Cek status login (kalau belum login -> tendang ke /login.html)
// 2. Navigasi antar panel (dashboard, biografi, riwayat, dst)
// 3. CRUD generik: load list, tambah, edit, hapus
// =========================================================

// ---------- 1. Cek status login ----------
async function cekLogin() {
  const res = await fetch('/api/auth/check');
  const data = await res.json();
  if (!data.loggedIn) {
    window.location.href = '/login.html';
    return;
  }
  document.getElementById('admin-username-label').textContent = data.username;
  muatSemuaData();
}

document.getElementById('btn-logout').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
});

// ---------- 2. Navigasi antar panel ----------
document.querySelectorAll('.admin-nav button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-nav button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.admin-main > section').forEach((s) => (s.style.display = 'none'));
    document.getElementById(btn.dataset.panel).style.display = 'block';
  });
});

// ---------- Helper request ke API admin ----------
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan.');
  return data;
}

// ---------- 3. BIOGRAFI ----------
async function muatBiografi() {
  const bio = await apiFetch('/api/admin/biografi');
  const form = document.getElementById('form-biografi');
  Object.entries(bio || {}).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value || '';
  });
}

document.getElementById('form-biografi').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());
  try {
    await apiFetch('/api/admin/biografi', { method: 'PUT', body: JSON.stringify(payload) });
    const box = document.getElementById('biografi-success');
    box.classList.add('show');
    setTimeout(() => box.classList.remove('show'), 2500);
    muatRingkasan();
  } catch (err) {
    alert(err.message);
  }
});

// ---------- Konfigurasi tiap koleksi (biar 1 fungsi bisa dipakai untuk semua) ----------
const KONFIGURASI_KOLEKSI = {
  belajar: {
    endpoint: '/api/admin/riwayat-belajar',
    listElId: 'list-admin-belajar',
    formId: 'form-belajar',
    judulUtama: (item) => item.institusi,
    subInfo: (item) => `${item.jurusan || ''} · ${item.tahun_mulai || ''}–${item.tahun_selesai || ''}`
  },
  kerja: {
    endpoint: '/api/admin/riwayat-kerja',
    listElId: 'list-admin-kerja',
    formId: 'form-kerja',
    judulUtama: (item) => item.perusahaan,
    subInfo: (item) => `${item.posisi || ''} · ${item.tahun_mulai || ''}–${item.tahun_selesai || ''}`
  },
  pencapaian: {
    endpoint: '/api/admin/pencapaian',
    listElId: 'list-admin-pencapaian',
    formId: 'form-pencapaian',
    judulUtama: (item) => item.judul,
    subInfo: (item) => `${item.penyelenggara || ''} · ${item.tahun || ''}`
  },
  project: {
    endpoint: '/api/admin/projects',
    listElId: 'list-admin-project',
    formId: 'form-project',
    judulUtama: (item) => item.judul,
    subInfo: (item) => item.tech_stack || ''
  }
};

// Simpan "sedang edit id berapa" per koleksi, supaya tombol submit
// tahu apakah harus POST (tambah baru) atau PUT (update).
const statusEdit = {};

async function muatDanRenderKoleksi(kunci) {
  const cfg = KONFIGURASI_KOLEKSI[kunci];
  const items = await apiFetch(cfg.endpoint);
  const container = document.getElementById(cfg.listElId);

  if (!items || items.length === 0) {
    container.innerHTML = '<p class="empty-state">Belum ada data.</p>';
    return;
  }

  container.innerHTML = items.map((item) => `
    <div class="data-row">
      <div class="info">
        <h4>${escapeHtml(cfg.judulUtama(item) || '(tanpa judul)')}</h4>
        <p>${escapeHtml(cfg.subInfo(item) || '')}</p>
      </div>
      <div class="actions">
        <button data-aksi="edit" data-id="${item.id}" data-kunci="${kunci}">Edit</button>
        <button data-aksi="hapus" data-id="${item.id}" data-kunci="${kunci}">Hapus</button>
      </div>
    </div>
  `).join('');
}

// Event delegation: satu listener untuk semua tombol edit/hapus
// di semua panel (lebih efisien daripada pasang listener 1-1).
document.querySelectorAll('.data-list').forEach((list) => {
  list.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-aksi]');
    if (!btn) return;
    const { aksi, id, kunci } = btn.dataset;
    const cfg = KONFIGURASI_KOLEKSI[kunci];

    if (aksi === 'hapus') {
      if (!confirm('Yakin mau hapus data ini?')) return;
      await apiFetch(`${cfg.endpoint}/${id}`, { method: 'DELETE' });
      muatDanRenderKoleksi(kunci);
      muatRingkasan();
      return;
    }

    if (aksi === 'edit') {
      const items = await apiFetch(cfg.endpoint);
      const item = items.find((i) => i.id === id);
      if (!item) return;

      const form = document.getElementById(cfg.formId);
      Object.entries(item).forEach(([key, value]) => {
        if (form.elements[key]) form.elements[key].value = value || '';
      });

      statusEdit[kunci] = id;
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Update Data';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Pasang handler submit form untuk tiap koleksi
Object.entries(KONFIGURASI_KOLEKSI).forEach(([kunci, cfg]) => {
  const form = document.getElementById(cfg.formId);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      if (statusEdit[kunci]) {
        // Sedang mode edit -> kirim PUT ke item yang bersangkutan
        await apiFetch(`${cfg.endpoint}/${statusEdit[kunci]}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        statusEdit[kunci] = null;
        form.querySelector('button[type="submit"]').textContent = 'Tambah';
      } else {
        // Mode tambah baru -> kirim POST
        await apiFetch(cfg.endpoint, { method: 'POST', body: JSON.stringify(payload) });
      }
      form.reset();
      muatDanRenderKoleksi(kunci);
      muatRingkasan();
    } catch (err) {
      alert(err.message);
    }
  });
});

// ---------- Ringkasan dashboard ----------
async function muatRingkasan() {
  const [belajar, kerja, pencapaian, project] = await Promise.all([
    apiFetch('/api/admin/riwayat-belajar'),
    apiFetch('/api/admin/riwayat-kerja'),
    apiFetch('/api/admin/pencapaian'),
    apiFetch('/api/admin/projects')
  ]);

  const data = [
    { label: 'Riwayat Belajar', jumlah: belajar.length },
    { label: 'Riwayat Kerja', jumlah: kerja.length },
    { label: 'Pencapaian', jumlah: pencapaian.length },
    { label: 'Project', jumlah: project.length }
  ];

  document.getElementById('ringkasan-grid').innerHTML = data.map((d) => `
    <div class="admin-panel" style="margin-bottom:0; text-align:center;">
      <div style="font-family: var(--font-display); font-size: 32px; font-weight:700; color: var(--navy);">${d.jumlah}</div>
      <div style="color: var(--ink-soft); font-size: 13px;">${d.label}</div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function muatSemuaData() {
  muatBiografi();
  muatRingkasan();
  Object.keys(KONFIGURASI_KOLEKSI).forEach((kunci) => muatDanRenderKoleksi(kunci));
}

cekLogin();
