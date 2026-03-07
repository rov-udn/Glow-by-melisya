"use strict";

document.addEventListener("DOMContentLoaded", () => {

  /* ============================================
     KONSTANTA & KONFIGURASI
     ============================================ */
  const NOMER_WA = "6282218712302"; // ← Ganti dengan nomor WA kamu

  // Daftar tanggal full booked (format: YYYY-MM-DD)
  // Kamu bisa mengisi ini manual, atau ambil dari Google Sheets (lihat bagian fetchJadwal)
  let tanggalPenuh = [
    // Contoh: "2026-03-15", "2026-03-22"
  ];

  /* ============================================
     1. NAVBAR — Scroll Effect + Hamburger
     ============================================ */
  const navbar    = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const navLinks  = document.getElementById("navLinks");

  // Buat backdrop overlay untuk mobile menu
  const backdrop = document.createElement("div");
  backdrop.className = "nav-backdrop";
  document.body.appendChild(backdrop);

  const closeNav = () => {
    hamburger.classList.remove("active");
    navLinks.classList.remove("open");
    backdrop.classList.remove("show");
    document.body.style.overflow = "";
  };

  // Scroll effect navbar
  const handleScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll(); // initial check

  // Toggle hamburger
  hamburger.addEventListener("click", () => {
    const isOpen = navLinks.classList.contains("open");
    if (isOpen) {
      closeNav();
    } else {
      hamburger.classList.add("active");
      navLinks.classList.add("open");
      backdrop.classList.add("show");
      document.body.style.overflow = "hidden";
    }
  });

  // Tutup saat link diklik
  navLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", closeNav));

  // Tutup saat backdrop diklik
  backdrop.addEventListener("click", closeNav);

  // Tutup dengan Escape
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (navLinks.classList.contains("open")) closeNav();
      if (modal.style.display === "flex") tutupModal();
    }
  });

  /* ============================================
     2. MODAL BOOKING
     ============================================ */
  const modal      = document.getElementById("bookingModal");
  const btnClose   = document.querySelector(".close-btn");
  const btnKirimWA = document.getElementById("btnWA");
  const inputNama  = document.getElementById("nama");
  const inputLayanan = document.getElementById("layanan");
  const inputTanggal = document.getElementById("tanggal");
  const inputCatatan = document.getElementById("catatan");

  // Set min tanggal = hari ini
  const today = new Date().toISOString().split("T")[0];
  inputTanggal.setAttribute("min", today);

  const bukaModal = () => {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    // Fokus ke input pertama setelah animasi
    setTimeout(() => inputNama.focus(), 400);
  };

  const tutupModal = () => {
    modal.style.display = "none";
    document.body.style.overflow = "";
    clearFormErrors();
  };

  document.querySelectorAll(".btn-buka-modal").forEach(btn =>
    btn.addEventListener("click", bukaModal)
  );
  btnClose.addEventListener("click", tutupModal);
  modal.addEventListener("click", e => { if (e.target === modal) tutupModal(); });

  // Validasi & highlight error
  const setError = (el, isError) => {
    el.classList.toggle("error", isError);
  };

  const clearFormErrors = () => {
    [inputNama, inputLayanan, inputTanggal].forEach(el => el.classList.remove("error"));
  };

  // Kirim ke WhatsApp
  btnKirimWA.addEventListener("click", () => {
    const nama    = inputNama.value.trim();
    const layanan = inputLayanan.value;
    const tanggal = inputTanggal.value;
    const catatan = inputCatatan.value.trim();

    let hasError = false;
    setError(inputNama,    !nama);
    setError(inputLayanan, !layanan);
    setError(inputTanggal, !tanggal);

    if (!nama || !layanan || !tanggal) {
      hasError = true;
      shakeModal();
      showToast("⚠️ Mohon lengkapi semua data yang wajib diisi ya, Kak!");
      return;
    }

    // Cek tanggal full booked
    if (tanggalPenuh.includes(tanggal)) {
      setError(inputTanggal, true);
      shakeModal();
      showToast("😔 Maaf Kak, tanggal ini sudah Full Booked. Silakan pilih tanggal lain.");
      return;
    }

    // Format tanggal
    const tgl = new Date(tanggal + "T00:00:00");
    const tanggalFormatted = tgl.toLocaleDateString("id-ID", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    let pesan =
      `Halo Kak Melisya ✨\n\n` +
      `Saya *${nama}*, ingin melakukan reservasi:\n\n` +
      `📋 *Layanan* : ${layanan}\n` +
      `📅 *Tanggal* : ${tanggalFormatted}`;

    if (catatan) pesan += `\n📝 *Catatan* : ${catatan}`;
    pesan += `\n\nApakah jadwal tersebut tersedia? Terima kasih! 🙏`;

    window.open(`https://wa.me/${NOMER_WA}?text=${encodeURIComponent(pesan)}`, "_blank");
    tutupModal();
  });

  function shakeModal() {
    const content = document.querySelector(".modal-content");
    content.style.animation = "none";
    void content.offsetWidth; // trigger reflow
    content.style.animation = "shakeModal 0.45s ease";
  }

  /* ============================================
     3. FETCH JADWAL dari Google Sheets
     ============================================ */
  async function fetchJadwal() {
    // Ganti SHEET_ID dengan ID Google Sheets kamu
    // Pastikan sheet sudah dipublikasikan sebagai CSV:
    // File → Bagikan → Publikasikan ke web → CSV
    const SHEET_ID  = "1lGbxAehXhT77YTcwpQiI3ENGF6i-WIma1USurkAEAHI";
    const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSEQCGcuZDJRlGekQ0TtqKdeF_IF2iicoFrbWybqkkQxiwzwCBogTq3UH5lfNO5yPzC4bf-iMgHN89_/pub?output=csv`;

    try {
      const res  = await fetch(SHEET_URL);
      const text = await res.text();
      // CSV: satu tanggal per baris (format YYYY-MM-DD)
      tanggalPenuh = text
        .split(/\r?\n/)
        .map(t => t.replace(/"/g, "").trim())
        .filter(t => /^\d{4}-\d{2}-\d{2}$/.test(t));

      // Re-render kalender setelah data diambil
      renderCalendar(currentYear, currentMonth);
    } catch (err) {
      console.warn("Gagal fetch jadwal dari Google Sheets:", err);
    }
  }

  fetchJadwal();

  /* ============================================
     4. KALENDER INTERAKTIF
     ============================================ */
  const calGrid      = document.getElementById("calGrid");
  const calMonthYear = document.getElementById("calMonthYear");
  const calPrev      = document.getElementById("calPrev");
  const calNext      = document.getElementById("calNext");

  const bulanID = ["Januari","Februari","Maret","April","Mei","Juni",
                   "Juli","Agustus","September","Oktober","November","Desember"];

  const nowDate    = new Date();
  let currentMonth = nowDate.getMonth();
  let currentYear  = nowDate.getFullYear();

  function renderCalendar(year, month) {
    // Hapus semua hari (biarkan header nama hari)
    const existing = calGrid.querySelectorAll(".day, .empty");
    existing.forEach(el => el.remove());

    calMonthYear.textContent = `${bulanID[month]} ${year}`;

    const firstDay  = new Date(year, month, 1).getDay(); // 0=Min
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Konversi: Minggu (0) → 6, Senin (1) → 0, dst (Senin sebagai hari pertama)
    const startOffset = (firstDay === 0) ? 6 : firstDay - 1;

    // Tambah sel kosong sebelum hari pertama
    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement("div");
      empty.className = "day empty";
      calGrid.appendChild(empty);
    }

    // Render hari
    for (let d = 1; d <= daysInMonth; d++) {
      const cell     = document.createElement("div");
      cell.className = "day";
      cell.textContent = d;

      const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

      if (tanggalPenuh.includes(dateStr)) {
        cell.classList.add("booked");
        cell.title = "Full Booked";
      }

      // Tandai hari ini
      if (year === nowDate.getFullYear() &&
          month === nowDate.getMonth() &&
          d === nowDate.getDate()) {
        cell.classList.add("today");
      }

      calGrid.appendChild(cell);
    }
  }

  calPrev.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar(currentYear, currentMonth);
  });

  calNext.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar(currentYear, currentMonth);
  });

  renderCalendar(currentYear, currentMonth);

  /* ============================================
     5. FAQ ACCORDION
     ============================================ */
  document.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
      const item   = btn.closest(".faq-item");
      const isOpen = item.classList.contains("active");

      document.querySelectorAll(".faq-item.active").forEach(el => el.classList.remove("active"));
      if (!isOpen) item.classList.add("active");
    });
  });

  /* ============================================
     6. SMOOTH SCROLL
     ============================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const href   = this.getAttribute("href");
      if (href === "#" || href === "#!") return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = navbar.offsetHeight + 12;
        window.scrollTo({ top: target.offsetTop - offset, behavior: "smooth" });
      }
    });
  });

  /* ============================================
     7. SCROLL REVEAL (IntersectionObserver)
     ============================================ */
  const revealEls = document.querySelectorAll(
    ".reveal-up, .reveal-left, .reveal-right"
  );

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el    = entry.target;
          const delay = parseInt(el.style.getPropertyValue("--delay")) || 0;
          setTimeout(() => el.classList.add("visible"), delay);
          revealObserver.unobserve(el);
        }
      });
    }, { threshold: 0.1 });

    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback untuk browser lama
    revealEls.forEach(el => el.classList.add("visible"));
  }

  /* ============================================
     8. TOAST NOTIFICATION
     ============================================ */
  function showToast(message) {
    const existing = document.querySelector(".toast-notif");
    if (existing) { existing.remove(); }

    const toast = document.createElement("div");
    toast.className = "toast-notif";
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add("show"));
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

});
