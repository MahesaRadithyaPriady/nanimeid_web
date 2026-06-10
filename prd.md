# PRD — NanimeID Web (Frontend)

**Dokumen:** Product Requirements Document — Frontend  
**Versi:** 1.0.0  
**Terakhir diperbarui:** Juni 2026  
**Author:** Frontend Team — Fathan Jamil  
**Status:** Draft

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Konteks Produk](#2-konteks-produk)
3. [Tujuan & Sasaran](#3-tujuan--sasaran)
4. [Target Pengguna](#4-target-pengguna)
5. [Design System](#5-design-system)
6. [Arsitektur Halaman (Information Architecture)](#6-arsitektur-halaman)
7. [Spesifikasi Halaman](#7-spesifikasi-halaman)
   - 7.1 Home Page
   - 7.2 Browse / Explore Page
   - 7.3 Anime Detail Page
   - 7.4 Watch Page (Video Player)
   - 7.5 Manga / Manhwa Reader Page
   - 7.6 Search Results Page
   - 7.7 Bookmark & History Page
   - 7.8 Profile Page
8. [Komponen Global](#8-komponen-global)
9. [Responsive Design & Breakpoints](#9-responsive-design--breakpoints)
10. [Aksesibilitas (A11y)](#10-aksesibilitas-a11y)
11. [Performa & Core Web Vitals](#11-performa--core-web-vitals)
12. [Tech Stack & Tooling](#12-tech-stack--tooling)
13. [State Management & Data Flow](#13-state-management--data-flow)
14. [Animasi & Motion](#14-animasi--motion)
15. [Out of Scope](#15-out-of-scope)
16. [Glossary](#16-glossary)

---

## 1. Ringkasan Eksekutif

NanimeID adalah aplikasi Android terkemuka untuk menonton anime dan membaca manga/manhwa/komik **tanpa iklan**, dengan 100.000+ download dan rating 4.3 di Google Play. Untuk memperluas jangkauan ke pengguna desktop dan browser-first, tim akan membangun **versi web** menggunakan React + TailwindCSS dengan inspirasi layout dari YouTube — familiar, scalable, dan content-forward.

Versi web ini bukan sekadar port dari mobile app, melainkan pengalaman baru yang dioptimalkan untuk layar besar dengan tetap mempertahankan identitas visual NanimeID yang distinctive: dark mode dengan aksen pink magenta.

---

## 2. Konteks Produk

| Item | Detail |
|---|---|
| Produk | NanimeID Web |
| Platform | Web Browser (Desktop-first, Mobile-responsive) |
| Framework | React 18+ |
| Styling | TailwindCSS v3+ |
| Mobile App | `com.nanime.id` (Android) |
| Tema | Dark mode default |
| Bahasa | Indonesia (i18n-ready) |

---

## 3. Tujuan & Sasaran

### Tujuan Bisnis
- Menjangkau pengguna yang preferensi menonton/membaca di desktop atau laptop.
- Meningkatkan brand awareness NanimeID di luar ekosistem Android.
- Menyediakan pengalaman multi-device yang konsisten.

### Tujuan UX
- Kurva belajar nol: user yang sudah familiar dengan YouTube langsung mengerti navigasinya.
- Time-to-first-content < 3 detik pada koneksi 4G rata-rata.
- Layout yang tidak pernah terasa "kosong" — konten selalu mengisi viewport secara natural.

### KPI Frontend
| Metrik | Target |
|---|---|
| LCP (Largest Contentful Paint) | ≤ 2.5 detik |
| FID / INP | ≤ 200 ms |
| CLS | ≤ 0.1 |
| Lighthouse Score | ≥ 85 (Performance), ≥ 90 (A11y) |
| Bundle Size (initial JS) | ≤ 200 KB gzipped |

---

## 4. Target Pengguna

### Persona Utama — "Andi, 19 tahun"
- Mahasiswa, menonton anime sehari-hari via smartphone, tapi sering buka laptop untuk tugas.
- Menginginkan pengalaman nonton yang sama baiknya di laptop tanpa harus install app.
- Tidak suka iklan; sangat menghargai USP utama NanimeID.

### Persona Sekunder — "Rina, 24 tahun"
- Pekerja kantoran, membaca manhwa di jam istirahat via browser karena ponsel sering habis baterai.
- Terbiasa dengan UI modern (Netflix, YouTube, Crunchyroll).
- Menggunakan fitur bookmark untuk melanjutkan bacaan.

---

## 5. Design System

### 5.1 Color Palette

```
┌─────────────────────────────────────────────────────────────────┐
│  DESIGN TOKEN             HEX         RGB              USAGE    │
├─────────────────────────────────────────────────────────────────┤
│  --color-primary-light    #ff99e6     255, 153, 230    Hover,   │
│                                                        glow     │
│  --color-primary          #ff66cd     255, 102, 205    CTA,     │
│                                                        aktif    │
│  --color-primary-deep     #ff66be     255, 102, 190    Badge,   │
│                                                        label    │
│  --color-muted            #aaaaaa     170, 170, 170    Sub-     │
│                                                        text,    │
│                                                        ikon     │
│  --color-bg-base          #0d0d0d     13,  13,  13     Body bg  │
│  --color-bg-surface       #161616     22,  22,  22     Card bg  │
│  --color-bg-elevated      #1f1f1f     31,  31,  31     Modal,   │
│                                                        tooltip  │
│  --color-bg-sidebar       #111111     17,  17,  17     Sidebar  │
│  --color-text-primary     #f0f0f0     240, 240, 240    Judul    │
│  --color-text-secondary   #aaaaaa     170, 170, 170    Keterangan│
│  --color-border           #2a2a2a     42,  42,  42     Divider  │
└─────────────────────────────────────────────────────────────────┘
```

**Penggunaan Warna Kritis:**
- Aksen pink **hanya boleh** dipakai pada elemen interaktif (button, badge aktif, progress bar, focus ring) — tidak untuk background block besar.
- Gradient resmi: `linear-gradient(135deg, #ff66cd 0%, #ff99e6 100%)` — dipakai pada hero banner overlay dan CTA utama.
- Glow efek: `box-shadow: 0 0 24px rgba(255, 102, 205, 0.35)` — pada card hover dan elemen featured.

### 5.2 Tipografi

```
┌───────────────────────────────────────────────────────┐
│  ROLE          FONT                WEIGHT   SIZE       │
├───────────────────────────────────────────────────────┤
│  Display       Plus Jakarta Sans   800      2xl–4xl    │
│  Heading       Plus Jakarta Sans   700      xl–2xl     │
│  Body          Inter               400      sm–base    │
│  Caption/Meta  Inter               400      xs         │
│  Mono / Badge  JetBrains Mono      500      xs–sm      │
└───────────────────────────────────────────────────────┘
```

**Skala Tipe (TailwindCSS custom):**
```js
// tailwind.config.js
fontSize: {
  'xs':   ['0.75rem',  { lineHeight: '1.1rem' }],
  'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
  'base': ['1rem',     { lineHeight: '1.5rem' }],
  'lg':   ['1.125rem', { lineHeight: '1.6rem' }],
  'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
  '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
  '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl':  ['2.25rem',  { lineHeight: '2.6rem' }],
}
```

### 5.3 Spacing & Sizing

```
Spacing Scale  : 4px base unit  → Tailwind default
Border Radius  :
  - card          : 12px   (rounded-xl)
  - button        : 8px    (rounded-lg)
  - badge/tag     : 9999px (rounded-full)
  - modal         : 16px   (rounded-2xl)
  - thumbnail     : 10px   (rounded-[10px])

Aspect Ratios  :
  - Anime thumbnail  : 2 / 3  (poster portrait)
  - Episode thumbnail: 16 / 9 (landscape)
  - Hero banner      : 21 / 9 (cinematic)
  - Manga cover      : 7 / 10

Sidebar Width  :
  - Expanded  : 240px
  - Collapsed : 72px
  - Mobile    : 100% (drawer overlay)

Content Max Width: 1440px (centered, px-4 md:px-8 lg:px-12)
```

### 5.4 Ikonografi

Gunakan **Lucide React** (konsisten, tree-shakeable). Ukuran standar:
- Navigasi sidebar: 22px
- Inline body: 16px
- Tombol CTA besar: 20px

### 5.5 Shadow & Elevation

```
Level 0  : no shadow  → --bg-surface cards (resting)
Level 1  : shadow-sm  → dropdowns, tooltips
Level 2  : shadow-lg  → modals, drawers
Level 3  : pink glow  → featured/hero cards on hover
            box-shadow: 0 8px 32px rgba(255,102,205,0.25)
```

---

## 6. Arsitektur Halaman

```
NanimeID Web
│
├── / (Home)
├── /browse (Explore / Browse)
│   ├── ?genre=action
│   ├── ?season=summer-2025
│   └── ?type=manga
├── /search?q={query}
├── /anime/{slug} (Detail Anime)
├── /watch/{slug}/ep/{episodeNumber} (Video Player)
├── /manga/{slug} (Detail Manga)
├── /read/{slug}/ch/{chapterNumber} (Manga Reader)
├── /bookmarks (Daftar Bookmark)
├── /history (Riwayat Tonton)
└── /profile (Profil Pengguna)
```

---

## 7. Spesifikasi Halaman

---

### 7.1 Home Page — `/`

**Tujuan:** Pintu masuk utama. Menampilkan konten unggulan, trending, dan rekomendasi personal — persis seperti halaman beranda YouTube.

#### Wireframe Layout (Desktop)

```
┌────────────────────────────────────────────────────────────────────────┐
│  TOPBAR (sticky, 64px)                                                 │
│  [☰ Logo]   [Searchbar ─────────────────]   [🔔] [👤]                │
├────────────┬───────────────────────────────────────────────────────────┤
│  SIDEBAR   │  MAIN CONTENT AREA                                        │
│  (240px)   │                                                           │
│            │  ┌─────────────────────────────────────────────────────┐ │
│  🏠 Home   │  │  HERO BANNER (Anime Unggulan)  — full width        │ │
│  🔍 Browse │  │  [Cover Besar] + [Judul | Genre | Sinopsis] + CTA  │ │
│  📚 Manga  │  │  ← → Navigation Dots                               │ │
│  🔖 Simpan │  └─────────────────────────────────────────────────────┘ │
│  🕒 Histor │                                                           │
│  ─────     │  [ Genre Filter Pills: Semua | Action | Romance | ... ]  │
│  📣 Rilis  │                                                           │
│  ⚙️ Seting │  ── TERBARU UPDATE ──────────────────────────────────    │
│            │  [Card][Card][Card][Card][Card][Card]  →                 │
│            │                                                           │
│            │  ── TRENDING MINGGU INI ─────────────────────────────    │
│            │  [Card][Card][Card][Card][Card][Card]  →                 │
│            │                                                           │
│            │  ── ANIME MUSIM INI ─────────────────────────────────    │
│            │  [Card][Card][Card][Card][Card][Card]  →                 │
│            │                                                           │
│            │  ── REKOMENDASI UNTUKMU ─────────────────────────────    │
│            │  [Card][Card][Card][Card][Card][Card]  →                 │
│            │                                                           │
│            │  ── MANGA / MANHWA POPULER ──────────────────────────    │
│            │  [Manga Card][...][...][...][...]       →                │
└────────────┴───────────────────────────────────────────────────────────┘
```

#### Komponen dalam Home Page

| Komponen | Deskripsi |
|---|---|
| `HeroBanner` | Carousel auto-play 5 detik. 3–5 anime unggulan. Overlay gradient gelap dari bawah. Tombol "Tonton Sekarang" (primary gradient pink) + "Simpan" (ghost). |
| `GenreFilterPills` | Horizontal scroll pills. Status aktif: background pink gradient. Transisi smooth 200ms. |
| `SectionRow` | Judul section + tombol "Lihat Semua" di kanan. Row scroll horizontal (snap scroll). |
| `AnimeCard` | Lihat spesifikasi di §8 |
| `MangaCard` | Lihat spesifikasi di §8 |

#### Hero Banner — Detail Spec

```
Height    : 480px desktop / 280px mobile
Background: Poster image dengan CSS blur(2px) scale(1.05) + 
            overlay linear-gradient(to top, #0d0d0d 0%, transparent 60%)
Content   : Absolute positioned bottom-left
  - Badge genre (pill pink)
  - Judul (font-size: 3xl, font-weight: 800, Plus Jakarta Sans)
  - Score ★ + Episode count
  - Sinopsis singkat (2 baris, truncated)
  - [Tonton Sekarang ▶] [+ Simpan]
Navigation: Dots bawah + arrow prev/next (muncul saat hover)
```

---

### 7.2 Browse / Explore Page — `/browse`

**Tujuan:** Halaman discovery. User bisa filter berdasarkan genre, tipe, season, tahun, status, dan urutan.

#### Wireframe Layout (Desktop)

```
┌────────────────────────────────────────────────────────────────────────┐
│  TOPBAR                                                                │
├────────────┬───────────────────────────────────────────────────────────┤
│  SIDEBAR   │  BROWSE                                                   │
│            │                                                           │
│            │  ┌──────────────────────── FILTER BAR ─────────────────┐ │
│            │  │ Tipe:[Anime▼] Genre:[Action▼] Season:[2025▼] Sort:  │ │
│            │  │ [Terbaru▼]   Status:[Ongoing▼]   [Reset Filter]     │ │
│            │  └─────────────────────────────────────────────────────┘ │
│            │                                                           │
│            │  Menampilkan 248 hasil                                    │
│            │                                                           │
│            │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│            │  │      │ │      │ │      │ │      │ │      │ │      │ │
│            │  │ Card │ │ Card │ │ Card │ │ Card │ │ Card │ │ Card │ │
│            │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │
│            │  ┌──────┐ ┌──────┐ ┌──────┐ ...                        │
│            │                                                           │
│            │  [ Load More / Infinite Scroll ]                         │
└────────────┴───────────────────────────────────────────────────────────┘
```

#### Spesifikasi Filter Bar

```
Filter Item     : Dropdown dengan ChevronDown icon
Filter Aktif    : Warna label menjadi pink, ada indikator dot
Reset Filter    : Ghost button, muncul hanya saat ada filter aktif
Mobile          : Filter dalam bottom sheet / drawer
Grid layout     : 
  Desktop (≥1280px) : 6 kolom
  Laptop  (≥1024px) : 5 kolom
  Tablet  (≥768px)  : 4 kolom
  Mobile  (<768px)  : 2 kolom
```

---

### 7.3 Anime Detail Page — `/anime/{slug}`

**Tujuan:** Halaman informasi lengkap sebuah anime beserta daftar episode.

#### Wireframe Layout (Desktop)

```
┌────────────────────────────────────────────────────────────────────────┐
│  TOPBAR                                                                │
├────────────┬───────────────────────────────────────────────────────────┤
│  SIDEBAR   │                                                           │
│            │  ┌─────────────── HERO DETAIL (blurred bg) ───────────┐  │
│            │  │  [POSTER 2/3]   JUDUL ANIME                        │  │
│            │  │  180x270px      ★ 8.5 · 24 Episode · Ongoing      │  │
│            │  │                 Studio: Mappa                      │  │
│            │  │                 Genre: [Action][Fantasy][Shounen]  │  │
│            │  │                 Tayang: Apr 2025 — sekarang        │  │
│            │  │                 [▶ Tonton Ep.1][+ Simpan][⋯ Lagi] │  │
│            │  └─────────────────────────────────────────────────────┘  │
│            │                                                           │
│            │  ┌──────────────────────────────────────────────────────┐ │
│            │  │  SINOPSIS                                            │ │
│            │  │  Lorem ipsum... [Baca Selengkapnya ▼]               │ │
│            │  └──────────────────────────────────────────────────────┘ │
│            │                                                           │
│            │  ┌──────────────────────────────────────────────────────┐ │
│            │  │  DAFTAR EPISODE                                      │ │
│            │  │  [Search episode] [Sort: Terlama▼] [Sub/Dub▼]      │ │
│            │  │  ┌──────────────────────────────────────────────┐   │ │
│            │  │  │ Ep.1 [Thumbnail 16:9] Judul Ep 1    24:35   │   │ │
│            │  │  │ Ep.2 [Thumbnail 16:9] Judul Ep 2    23:48   │   │ │
│            │  │  │ ...                                          │   │ │
│            │  │  └──────────────────────────────────────────────┘   │ │
│            │  └──────────────────────────────────────────────────────┘ │
│            │                                                           │
│            │  ── ANIME SERUPA ─────────────────────────────────────   │
│            │  [Card][Card][Card][Card][Card]                         │
└────────────┴───────────────────────────────────────────────────────────┘
```

#### Spesifikasi Komponen Detail

**Hero Detail:**
```
Background  : Poster anime di-blur (filter: blur(40px) brightness(0.3))
              full width, height 320px
Poster      : z-index lebih tinggi, bayangan ke kanan
Badge status: "ONGOING" → hijau mint, "COMPLETED" → abu-abu, 
              "UPCOMING" → pink
Rating      : Bintang terisi pink, teks angka putih
Tombol aksi :
  Primer    : gradient pink, "▶ Tonton Ep.1"
  Sekunder  : outline pink, "+ Simpan" / "✓ Tersimpan"
  More      : icon ⋯ membuka dropdown (share, copy link, report)
```

**Daftar Episode:**
```
Layout      : List vertikal (bukan grid) — mirip playlist YouTube
Item episode:
  - Thumbnail 16:9 (160x90px) dengan nomor episode overlay
  - Judul episode + durasi
  - Badge "SUB" / "DUB" 
  - Progress bar tipis di bawah thumbnail jika sudah ditonton
  - Status: belum tonton / sedang tonton / sudah tonton
Episode aktif (terakhir ditonton): highlighted dengan border pink kiri
```

---

### 7.4 Watch Page — `/watch/{slug}/ep/{episodeNumber}`

**Tujuan:** Halaman utama menonton. Ini adalah halaman terpenting — mirip layout `/watch` YouTube dengan player besar di kiri dan list episode di kanan.

#### Wireframe Layout (Desktop)

```
┌────────────────────────────────────────────────────────────────────────┐
│  TOPBAR (compact, 56px)                                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────┐  ┌────────────────────┐  │
│  │                                         │  │  EPISODE LIST      │  │
│  │   VIDEO PLAYER                          │  │  ────────────────  │  │
│  │   (16:9, max-width: 900px)              │  │  [search episode]  │  │
│  │                                         │  │  ────────────────  │  │
│  │   [ ▶  ───────────────────  🔊  ⛶ ]   │  │  Ep1  [thumb] ...  │  │
│  │                                         │  │  Ep2  [thumb] ...  │  │
│  └─────────────────────────────────────────┘  │  Ep3  [thumb] ... ◄│  │
│                                               │  ...               │  │
│  ┌─────────────────────────────────────────┐  │  Ep24 [thumb] ...  │  │
│  │  Judul Anime — Ep.3: "Judul Episode"    │  └────────────────────┘  │
│  │  ★ 8.5 · Studio Mappa · Apr 2025       │                          │
│  │  [⬅ Ep Sebelumnya] [Ep Berikutnya ➡]   │                          │
│  │                                         │                          │
│  │  [SUB] [720p ▼] [Kecepatan 1x ▼]       │                          │
│  └─────────────────────────────────────────┘                          │
│                                                                        │
│  ── KOMENTAR ────────────────────────────────────                     │
│  [Avatar] [Input komentar...]                                          │
│  [Komentar 1] [Komentar 2] ...                                        │
│                                                                        │
│  ── REKOMENDASI ─────────────────────────────                         │
│  [Card][Card][Card][Card][Card][Card]                                  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Spesifikasi Video Player

```
Wrapper     : aspect-ratio: 16/9, background: #000, border-radius: 12px
                max-width: 900px di layout normal
                100vw saat fullscreen

Controls    : Muncul saat hover / tap, fade out 3 detik
  - Progress bar: pink gradient, hover mengembang jadi 6px
  - Buffered    : warna muted abu-abu transparan
  - Tombol:     Play/Pause, Maju 10s, Mundur 10s, Volume, 
                Subtitle Toggle, Quality, Speed, Fullscreen
  - Waktu       : 00:00 / 24:35 (JetBrains Mono)

Keyboard shortcuts:
  Space         : Play / Pause
  ← / →         : Mundur / Maju 10 detik
  ↑ / ↓         : Volume naik/turun
  F             : Toggle fullscreen
  M             : Toggle mute

Mobile (< 768px):
  - Player 100% lebar
  - Episode list masuk ke bawah player (scroll vertikal)
  - Double tap kiri/kanan untuk skip 10 detik
  - Geser vertikal untuk volume (kanan) / brightness (kiri)
```

#### Episode List Sidebar

```
Width       : 380px
Position    : sticky, top: 56px (topbar height), max-height: calc(100vh - 56px)
Overflow    : scroll-y custom (thin scrollbar pink)

Item        :
  - Thumbnail 16:9 (120x68px)
  - Nomor episode (badge kecil)
  - Judul episode (max 2 baris)
  - Durasi
  - Progress bar tipis (jika sudah ditonton sebagian)
  
Item aktif  : background #1f1f1f, border-left 3px solid #ff66cd
```

---

### 7.5 Manga / Manhwa Reader — `/read/{slug}/ch/{chapterNumber}`

**Tujuan:** Halaman membaca manga/manhwa. Mode baca yang immersive dengan minimal chrome UI.

#### Wireframe Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  ┌──────────── READER TOPBAR (muncul saat hover/tap atas) ──────────┐  │
│  │  [← Kembali]  Judul Manga — Chapter 42  [⚙️ Setelan Baca]      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│            ┌──────────────────────────────┐                           │
│            │                              │                           │
│            │   Halaman Manga (image)      │                           │
│            │   max-width: 800px           │                           │
│            │   centered                   │                           │
│            │                              │                           │
│            └──────────────────────────────┘                           │
│            ┌──────────────────────────────┐                           │
│            │                              │                           │
│            │   Halaman Manga (image)      │                           │
│            │   (Long Strip mode)          │                           │
│            │                              │                           │
│            └──────────────────────────────┘                           │
│            ...                                                         │
│                                                                        │
│  ┌──────────────────── READER BOTTOMBAR ────────────────────────────┐  │
│  │  [⬅ Chapter 41]   Page 5 / 48   ─────●─────────  [Chapter 43 ➡]│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Mode Baca

| Mode | Deskripsi |
|---|---|
| `Vertikal (Long Strip)` | Default untuk Manhwa — scroll ke bawah terus |
| `Horizontal Kanan-Kiri` | Default untuk Manga Jepang — swipe/klik navigasi |
| `Horizontal Kiri-Kanan` | Untuk komik barat/webtoon |
| `Double Page` | 2 halaman berdampingan (desktop only) |

**Setelan Reader (Panel/Drawer):**
```
- Mode baca (toggle)
- Ukuran halaman: Fit width / Fit height / Original
- Background: Hitam / Putih / Abu-abu
- Jarak antar halaman: None / Kecil / Besar
- Auto-scroll (speed slider)
```

---

### 7.6 Search Results Page — `/search?q={query}`

#### Wireframe Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  TOPBAR (searchbar aktif/fokus)                                        │
├────────────┬───────────────────────────────────────────────────────────┤
│  SIDEBAR   │                                                           │
│            │  Hasil pencarian: "naruto" (248 hasil)                   │
│            │                                                           │
│            │  [Filter: Semua | Anime | Manga | Karakter]              │
│            │                                                           │
│            │  KONTEN TERBAIK (featured — 1 baris besar)               │
│            │  ┌──────────────────────────────────────────────────┐    │
│            │  │ [Poster] Naruto                                   │    │
│            │  │          ★ 8.9 · 720 Episode · 2002             │    │
│            │  │          Genre: Action, Adventure                 │    │
│            │  │          [▶ Tonton] [+ Simpan]                  │    │
│            │  └──────────────────────────────────────────────────┘    │
│            │                                                           │
│            │  SEMUA HASIL                                              │
│            │  [Card][Card][Card][Card][Card][Card]                    │
│            │  [Card][Card][Card][Card][Card][Card]                    │
└────────────┴───────────────────────────────────────────────────────────┘
```

**Fitur Search:**
```
Autocomplete    : Dropdown saran muncul saat mengetik (debounce 300ms)
Riwayat         : Saran dari history pencarian sebelumnya
Empty state     : Ilustrasi + teks "Tidak ditemukan untuk '{query}'"
                  + Saran pencarian alternatif
Keyboard        : ↑↓ navigasi saran, Enter konfirmasi, Esc tutup
```

---

### 7.7 Bookmark & History Page — `/bookmarks` dan `/history`

#### Wireframe Layout (Bookmarks)

```
┌─────────────────────────────────────────────────────────────────────┐
│  TOPBAR                                                             │
├───────────┬─────────────────────────────────────────────────────────┤
│  SIDEBAR  │                                                         │
│           │  Daftar Simpanan                                        │
│           │  [Semua | Anime | Manga | Manhwa]   [Urutkan ▼]        │
│           │                                                         │
│           │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│           │  │ Poster │ │ Poster │ │ Poster │ │ Poster │          │
│           │  │ Judul  │ │ Judul  │ │ Judul  │ │ Judul  │          │
│           │  │ Ep 5/24│ │ Ch3/80 │ │ Ep 12  │ │ Ep 3   │          │
│           │  └────────┘ └────────┘ └────────┘ └────────┘          │
│           │                                                         │
└───────────┴─────────────────────────────────────────────────────────┘
```

**Spesifikasi:**
- Bookmark card menampilkan progress (episode / chapter terakhir)
- Tombol "Lanjutkan" langsung ke episode/chapter terakhir
- Swipe-to-remove (mobile) / hover delete icon (desktop)
- Empty state: ilustrasi dengan CTA ke Browse

---

### 7.8 Profile Page — `/profile`

```
┌──────────────────────────────────────────────────┐
│  [Avatar] Username                               │
│           email@nanime.id                        │
│           [Edit Profil]                          │
├──────────────────────────────────────────────────┤
│  Statistik Tontonan                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  124     │ │  38      │ │  5,280   │         │
│  │  Anime   │ │  Manga   │ │  Episode │         │
│  └──────────┘ └──────────┘ └──────────┘         │
├──────────────────────────────────────────────────┤
│  Preferensi                                      │
│  ─ Bahasa subtitle default: Indonesia            │
│  ─ Kualitas default: 720p                        │
│  ─ Notifikasi anime baru: ON                     │
├──────────────────────────────────────────────────┤
│  Keluar                                          │
└──────────────────────────────────────────────────┘
```

---

## 8. Komponen Global

### 8.1 Topbar / Navbar

```
Height      : 64px (56px saat scroll down)
Position    : sticky, top: 0, z-index: 50
Background  : #0d0d0d dengan backdrop-blur (saat scroll: semi-transparent)
Transition  : height 200ms ease

Kiri  : [☰ Hamburger (mobile/collapsed)] [Logo NanimeID]
Tengah: [Searchbar — max-width: 560px]
Kanan : [Notifikasi 🔔] [Avatar / Login]

Searchbar:
  Default   : background #1f1f1f, border #2a2a2a, rounded-full
  Fokus     : border #ff66cd, box-shadow: 0 0 0 2px rgba(255,102,205,0.2)
  Ikon      : SearchIcon kiri, XIcon kanan (saat ada teks)
```

### 8.2 Sidebar Navigation

```
Desktop (expanded):
  Width     : 240px
  Items     : [Icon + Label] 
  Aktif     : background rgba(255,102,205,0.1), teks pink, border-left 3px pink
  Hover     : background #1f1f1f

Desktop (collapsed, toggle):
  Width     : 72px
  Items     : [Icon only] dengan tooltip saat hover

Mobile:
  Drawer overlay full height, close saat click outside
  Backdrop  : rgba(0,0,0,0.7) blur
  Animasi   : slide-in dari kiri 300ms cubic-bezier(0.4, 0, 0.2, 1)

Items:
  🏠  Beranda          /
  🔍  Jelajahi         /browse
  📺  Anime Terbaru    /browse?type=anime&sort=latest
  📚  Manga/Manhwa     /browse?type=manga
  🔖  Tersimpan        /bookmarks
  🕒  Riwayat          /history
  ─── (divider)
  📣  Jadwal Rilis     /schedule
  ⚙️  Pengaturan       /settings
```

### 8.3 AnimeCard Component

```
┌──────────────┐
│              │  ← aspect-ratio: 2/3 (portrait)
│   POSTER     │     background: #161616
│              │     border-radius: 10px
│  [BADGE EP]  │  ← badge "Ep 12" atau "NEW" bottom-left
└──────────────┘
 Judul Anime      ← font-weight: 600, max 2 baris, truncate
 ★ 8.5 · Ongoing  ← text-sm text-muted
```

**Interaksi:**
```
Hover (desktop):
  - Skala: scale(1.04)
  - Shadow: 0 8px 32px rgba(255,102,205,0.25)
  - Poster: slight zoom (scale 1.1 with overflow hidden)
  - Muncul overlay bottom: [▶ Tonton] [+ Simpan]
  - Transisi: 200ms ease-out

Klik : Navigate ke /anime/{slug}
```

### 8.4 EpisodeCard Component (untuk list)

```
┌──────────────────────────────────────────────────────┐
│ [THUMB 16:9]  Ep.3 — Judul Episode Panjang           │
│  120x68px     24:35  [SUB]  ██░░░░ 40%               │
└──────────────────────────────────────────────────────┘
```

### 8.5 Badge Component

```
Varian:
  genre     : text-xs, rounded-full, bg: rgba(255,102,205,0.15), text: #ff99e6, px-3 py-1
  status    :
    ongoing : bg: rgba(74,222,128,0.15), text: #4ade80
    completed: bg: rgba(170,170,170,0.15), text: #aaaaaa
    upcoming: bg: rgba(255,102,205,0.15), text: #ff66cd
  type      : bg-#1f1f1f, text-white
  episode   : bg-black/70, text-white (overlay pada thumbnail)
```

### 8.6 Loading States

```
Skeleton:
  Background: #1f1f1f dengan shimmer animation
  @keyframes shimmer {
    0%   { background-position: -400px 0 }
    100% { background-position: 400px 0 }
  }
  background: linear-gradient(90deg, #1f1f1f 25%, #2a2a2a 50%, #1f1f1f 75%)
  background-size: 800px 100%

AnimeCard skeleton  : Persegi panjang 2/3 ratio + 2 baris teks
EpisodeCard skeleton: Landscape rect + 2 baris teks
Hero skeleton       : Full width 480px rect
```

### 8.7 Toast / Notification

```
Position    : bottom-right, stack ke atas, max 3 toast sekaligus
Varian      :
  success   : border-left: 3px solid #4ade80
  error     : border-left: 3px solid #f87171
  info      : border-left: 3px solid #ff66cd
Auto-dismiss: 4 detik
Animation   : slide in dari kanan, fade out
```

### 8.8 Modal Component

```
Backdrop    : rgba(0,0,0,0.8) blur(4px)
Content     : background #1f1f1f, border-radius: 16px, max-width: 480px
Header      : Judul + tombol X
Animation   : scale from 0.9 + fade in, 200ms ease-out
Close       : Klik backdrop, Esc key, tombol X
```

---

## 9. Responsive Design & Breakpoints

```
TailwindCSS Breakpoints (custom override):
  xs  :  <480px   (Small mobile)
  sm  : ≥480px   (Mobile landscape / large mobile)
  md  : ≥768px   (Tablet)
  lg  : ≥1024px  (Laptop)
  xl  : ≥1280px  (Desktop)
  2xl : ≥1536px  (Large desktop)

Layout perubahan per breakpoint:
┌─────────────────────────────────────────────────────────────────────┐
│  ELEMEN              xs/sm     md        lg        xl/2xl           │
├─────────────────────────────────────────────────────────────────────┤
│  Sidebar             hidden    hidden    collapsed  expanded         │
│  TopBar              compact   compact   full       full             │
│  Grid card cols      2         3         4–5        5–6             │
│  Hero height         220px     320px     420px      480px            │
│  Watch layout        stacked   stacked   side-by-side side-by-side  │
│  Episode list        below     below     sidebar    sidebar          │
│  Player max-width    100%      100%      70%        75%              │
└─────────────────────────────────────────────────────────────────────┘
```

**Mobile-specific UX:**
- Bottom navigation bar (mobile only) dengan 4 ikon: Beranda, Jelajahi, Tersimpan, Profil
- No hover states — gunakan active/pressed state
- Swipe gestures pada manga reader dan carousel
- Player controls lebih besar (44px minimum touch target)

---

## 10. Aksesibilitas (A11y)

### Standar Target: WCAG 2.1 AA

| Area | Spesifikasi |
|---|---|
| Kontras teks | Minimum 4.5:1 untuk teks normal, 3:1 untuk teks besar |
| Focus ring | `outline: 2px solid #ff66cd; outline-offset: 2px` (jangan dihapus) |
| Keyboard nav | Semua interaksi bisa dicapai via Tab / Enter / Space / Arrow keys |
| Screen reader | `aria-label` pada semua ikon tanpa teks, `aria-live` untuk notifikasi |
| Gambar | `alt` text deskriptif untuk semua poster dan thumbnail |
| Motion | Hormati `prefers-reduced-motion` — matikan semua animasi non-esensial |
| Color only | Jangan gunakan warna sebagai satu-satunya indikator informasi |

```jsx
// Contoh implementasi focus ring di tailwind.config.js
ring: {
  DEFAULT: '2px',
  color: '#ff66cd',
}

// Komponen button
<button 
  className="focus-visible:ring-2 focus-visible:ring-[#ff66cd] focus-visible:outline-none"
  aria-label="Tambahkan ke daftar simpan"
>
```

---

## 11. Performa & Core Web Vitals

### Strategi Optimasi

**Image Optimization:**
```
- Gunakan <img loading="lazy" decoding="async"> untuk semua thumbnail
- Format WebP dengan fallback JPEG
- Gunakan srcset untuk responsive images
- Placeholder blur (low-quality image placeholder / LQIP) sebelum load
- Poster anime: preload hanya untuk above-the-fold
```

**Code Splitting & Lazy Loading:**
```jsx
// Setiap halaman di-lazy load
const WatchPage    = lazy(() => import('./pages/WatchPage'));
const MangaReader  = lazy(() => import('./pages/MangaReader'));
const BrowsePage   = lazy(() => import('./pages/BrowsePage'));

// Dibungkus Suspense dengan skeleton fallback
<Suspense fallback={<PageSkeleton />}>
  <WatchPage />
</Suspense>
```

**Rendering Strategy:**
```
Home Page      : SSR atau SSG dengan revalidasi 5 menit (Next.js ISR)
Detail Page    : SSR (konten dinamis)
Watch Page     : CSR (player state, progress — user-specific)
Browse Page    : SSR + CSR hydration untuk filter
```

**Bundle Strategy:**
```
Vendor chunk   : react, react-dom, react-router-dom → satu chunk
UI chunk       : komponen heavy (player, reader) → on-demand
Icons          : Tree-shake Lucide — hanya import yang digunakan
CSS            : PurgeCSS via TailwindCSS JIT — hanya kelas yang dipakai
```

---

## 12. Tech Stack & Tooling

```
Category          Library / Tool              Version
─────────────────────────────────────────────────────────
Framework         React                       18.x
Routing           React Router DOM            v6.x
Styling           TailwindCSS                 3.x
Styling Extra     clsx + tailwind-merge       latest
Icons             Lucide React                latest
State Global      Zustand                     4.x
Server State      TanStack Query (React Query)5.x
HTTP Client       Axios                       1.x
Forms             React Hook Form + Zod       latest
Video Player      Video.js atau Plyr.js       latest
Animations        Framer Motion               11.x
Build Tool        Vite                        5.x
Testing           Vitest + Testing Library    latest
Linting           ESLint + Prettier           latest
Type Safety       TypeScript                  5.x
```

### Folder Structure

```
src/
├── assets/              # Gambar statis, font, ikon SVG
├── components/
│   ├── ui/              # Primitives: Button, Badge, Modal, Toast
│   ├── layout/          # Topbar, Sidebar, BottomNav, PageLayout
│   ├── cards/           # AnimeCard, MangaCard, EpisodeCard
│   ├── sections/        # HeroBanner, SectionRow, GenreFilter
│   ├── player/          # VideoPlayer, PlayerControls, EpisodeList
│   └── reader/          # MangaReader, ReaderControls, PageViewer
├── pages/
│   ├── HomePage.tsx
│   ├── BrowsePage.tsx
│   ├── AnimeDetailPage.tsx
│   ├── WatchPage.tsx
│   ├── MangaReaderPage.tsx
│   ├── SearchPage.tsx
│   ├── BookmarksPage.tsx
│   ├── HistoryPage.tsx
│   └── ProfilePage.tsx
├── hooks/               # useDebounce, useInfiniteScroll, useLocalStorage
├── stores/              # Zustand stores: playerStore, bookmarkStore, authStore
├── services/            # API calls, query functions
├── types/               # TypeScript interfaces
├── utils/               # Helper functions
├── constants/           # Routes, config, breakpoints
└── styles/
    ├── globals.css      # CSS variables, font-face, reset
    └── tailwind.css     # Tailwind directives
```

---

## 13. State Management & Data Flow

### Zustand Stores

```ts
// playerStore.ts
interface PlayerStore {
  currentAnime: Anime | null;
  currentEpisode: Episode | null;
  watchProgress: Record<string, number>; // episodeId → progress (0-1)
  volume: number;
  quality: '360p' | '480p' | '720p' | '1080p';
  subtitleLang: 'id' | 'en' | 'off';
}

// bookmarkStore.ts
interface BookmarkStore {
  bookmarks: Bookmark[];
  addBookmark: (item: Anime | Manga) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
}

// uiStore.ts
interface UIStore {
  sidebarExpanded: boolean;
  mobileMenuOpen: boolean;
  activeToasts: Toast[];
}
```

### React Query Patterns

```ts
// Contoh query hook
export function useAnimeDetail(slug: string) {
  return useQuery({
    queryKey: ['anime', slug],
    queryFn: () => animeApi.getDetail(slug),
    staleTime: 5 * 60 * 1000,    // 5 menit
    gcTime:    30 * 60 * 1000,   // 30 menit cache
  });
}

export function useInfiniteAnimeList(filters: BrowseFilters) {
  return useInfiniteQuery({
    queryKey: ['anime-list', filters],
    queryFn: ({ pageParam = 1 }) => animeApi.getList({ ...filters, page: pageParam }),
    getNextPageParam: (last) => last.hasMore ? last.nextPage : undefined,
  });
}
```

---

## 14. Animasi & Motion

### Prinsip
- Animasi melayani konten, bukan sebaliknya.
- Durasi: 150ms (micro) / 250ms (standard) / 350ms (expressive).
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material ease-in-out).

### Inventory Animasi

| Elemen | Animasi | Durasi |
|---|---|---|
| Card hover | scale(1.04) + glow shadow | 200ms ease-out |
| Sidebar expand/collapse | width transition | 250ms ease |
| Hero banner slide | translateX + fade | 400ms ease |
| Page transition | fade + translateY(8px) | 250ms |
| Modal open | scale(0.9→1) + opacity | 200ms |
| Toast in/out | translateX + opacity | 250ms |
| Skeleton shimmer | background-position loop | 1.5s infinite |
| Tab/filter active | background + underline | 150ms |
| Dropdown open | scaleY(0→1) + opacity | 150ms |
| Progress bar fill | width transition | 300ms |

```css
/* Contoh: Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 15. Out of Scope (v1.0)

Fitur-fitur berikut **tidak termasuk** dalam scope PRD ini dan akan dipertimbangkan untuk versi selanjutnya:

- Sistem login / autentikasi pengguna (fitur non-akun dulu)
- Komentar dan sistem rating pengguna
- Sistem notifikasi real-time (WebSocket)
- Multi-bahasa selain Indonesia
- Dark/Light mode toggle (hanya dark mode di v1)
- Download untuk nonton offline
- Chromecast / AirPlay
- Fitur share screen / watch party
- Progressive Web App (PWA) install prompt
- Admin dashboard konten

---

## 16. Glossary

| Istilah | Definisi |
|---|---|
| LCP | Largest Contentful Paint — metrik performa Core Web Vitals |
| CLS | Cumulative Layout Shift — stabilitas visual layout |
| INP | Interaction to Next Paint — responsivitas interaksi |
| ISR | Incremental Static Regeneration (Next.js) |
| LQIP | Low Quality Image Placeholder — teknik placeholder gambar buram |
| A11y | Aksesibilitas (Accessibility) |
| USP | Unique Selling Point |
| Slug | URL-friendly identifier untuk anime/manga (contoh: `shingeki-no-kyojin`) |
| Manhwa | Komik dari Korea Selatan (biasanya format long strip vertikal) |
| Manhua | Komik dari China |

---

*Dokumen ini disiapkan oleh tim frontend CHEEZY PEEZY. Versi ini adalah living document — semua perubahan harus dicatat dengan nomor versi dan tanggal revisi.*

---

**© 2026 NanimeID — CHEEZY PEEZY. Internal Use Only.**