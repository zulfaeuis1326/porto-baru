// =========================================================
// main.js
// ---------------------------------------------------------
// Mengambil data dari /api/public/all (read-only, tidak perlu
// login) lalu menyuntikkannya ke elemen-elemen di index.html,
// plus semua interaksi visual (scroll progress, nav aktif,
// reveal animation, animasi jaringan di hero).
// =========================================================

document.getElementById('tahun-footer').textContent = new Date().getFullYear();

async function muatDataPublik() {
  try {
    const res = await fetch('/api/public/all');
    if (!res.ok) throw new Error('Gagal mengambil data');
    const data = await res.json();

    renderBiografi(data.biografi);
    renderTimeline('list-belajar', data.riwayat_belajar, 'belajar');
    renderTimeline('list-kerja', data.riwayat_kerja, 'kerja');
    renderPencapaian(data.pencapaian);
    renderProject(data.projects);

    aktifkanRevealScroll();
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error(err);
  }
}

function renderBiografi(bio) {
  if (!bio) return;
  document.getElementById('hero-nama').textContent = bio.nama || 'Nama belum diisi';
  document.getElementById('hero-tagline').textContent = bio.tagline || '';
  document.getElementById('hero-desc').textContent = bio.deskripsi || '';
  document.getElementById('brand-name').innerHTML = (bio.nama || 'Portofolio').split(' ')[0] + '<span>.</span>';
  document.getElementById('footer-nama').textContent = bio.nama || 'Portofolio';

  if (bio.foto_url) {
    const img = document.getElementById('hero-foto');
    img.src = bio.foto_url;
    img.style.display = 'block';
    document.getElementById('hero-foto-placeholder').style.display = 'none';
  }
}

function renderTimeline(elementId, items, jenis) {
  const container = document.getElementById(elementId);
  if (!items || items.length === 0) {
    container.innerHTML = `<p class="empty-state">Belum ada data ${jenis === 'belajar' ? 'riwayat belajar' : 'pengalaman kerja'}.</p>`;
    return;
  }

  container.innerHTML = items.map((item) => {
    const judulUtama = jenis === 'belajar' ? item.institusi : item.perusahaan;
    const subJudul = jenis === 'belajar' ? item.jurusan : item.posisi;
    return `
      <div class="timeline-item reveal">
        <div class="periode">${escapeHtml(item.tahun_mulai || '')} — ${escapeHtml(item.tahun_selesai || 'Sekarang')}</div>
        <h3>${escapeHtml(judulUtama || '')}</h3>
        <div class="sub">${escapeHtml(subJudul || '')}</div>
        <div class="desc">${escapeHtml(item.deskripsi || '')}</div>
      </div>
    `;
  }).join('');
}

function renderPencapaian(items) {
  const container = document.getElementById('list-pencapaian');
  if (!items || items.length === 0) {
    container.innerHTML = `<p class="empty-state">Belum ada data pencapaian.</p>`;
    return;
  }

  container.innerHTML = items.map((item) => `
    <div class="achievement-card">
      <div class="tahun">${escapeHtml(item.tahun || '')}</div>
      <h4>${escapeHtml(item.judul || '')}</h4>
      <div class="penyelenggara">${escapeHtml(item.penyelenggara || '')}</div>
      <p style="font-size:14px; color: var(--ink-soft); margin:0;">${escapeHtml(item.deskripsi || '')}</p>
      ${item.url_bukti ? `<a href="${escapeAttr(item.url_bukti)}" target="_blank" rel="noopener" style="font-size:13px; font-weight:600; color: var(--navy);">Lihat bukti &rarr;</a>` : ''}
    </div>
  `).join('');
}

function renderProject(items) {
  const container = document.getElementById('list-project');
  if (!items || items.length === 0) {
    container.innerHTML = `<p class="empty-state">Belum ada project yang ditambahkan.</p>`;
    return;
  }

  container.innerHTML = items.map((item) => {
    const tags = (item.tech_stack || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`)
      .join('');

    return `
      <div class="project-card">
        <div class="thumb">
          ${item.gambar_url
            ? `<img src="${escapeAttr(item.gambar_url)}" alt="${escapeAttr(item.judul || '')}">`
            : 'PREVIEW'}
        </div>
        <div class="body">
          <h3>${escapeHtml(item.judul || '')}</h3>
          <p>${escapeHtml(item.deskripsi || '')}</p>
          <div class="tech-tags">${tags}</div>
          <div class="project-links">
            ${item.url_demo ? `<a href="${escapeAttr(item.url_demo)}" target="_blank" rel="noopener">Live Demo</a>` : ''}
            ${item.url_repo ? `<a href="${escapeAttr(item.url_repo)}" target="_blank" rel="noopener">Source Code</a>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Animasi fade-in + node "menyala" saat elemen masuk viewport.
function aktifkanRevealScroll() {
  const elements = document.querySelectorAll('.reveal, [data-stagger]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach((el) => observer.observe(el));
}

// ---------------------------------------------------------
// Scroll progress bar
// ---------------------------------------------------------
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = scrolled + '%';
  }, { passive: true });
}

// ---------------------------------------------------------
// Nav: highlight link aktif sesuai section yang terlihat + toggle mobile
// ---------------------------------------------------------
function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
      });
    });
  }

  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navAnchors.forEach((a) => a.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  sections.forEach((s) => navObserver.observe(s));
}

// ---------------------------------------------------------
// Hero network canvas — titik-titik bergerak saling terhubung,
// metafora ringan dari latar belakang jaringan (TKJ).
// ---------------------------------------------------------
function initHeroNet() {
  const canvas = document.getElementById('hero-net');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, points;

  function resize() {
    const hero = canvas.closest('.hero');
    w = canvas.width = hero.clientWidth;
    h = canvas.height = hero.clientHeight;
    const count = window.innerWidth < 700 ? 18 : 34;
    points = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    points.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    });
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.strokeStyle = `rgba(31,184,172,${0.14 * (1 - dist / 140)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }
    points.forEach((p) => {
      ctx.fillStyle = 'rgba(22,48,92,0.35)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    tick();
  }
}

// Escape teks biasa (mencegah XSS kalau ada data yang mengandung tag HTML)
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Escape khusus untuk dipakai di dalam atribut HTML (href, src)
function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

initScrollProgress();
initNav();
initHeroNet();
muatDataPublik();
