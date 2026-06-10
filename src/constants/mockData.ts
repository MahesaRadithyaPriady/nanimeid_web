import type { Anime, Episode, Manga, Comment } from '../types';

export const GENRES = [
  'Semua',
  'Action',
  'Adventure',
  'Fantasy',
  'Drama',
  'Sci-Fi',
  'Slice of Life',
  'Comedy',
  'Romance',
  'Mystery',
  'Supernatural',
  'Historical',
  'School'
];

export const MOCK_ANIMES: Anime[] = [
  {
    id: 'a1',
    title: 'Solo Leveling: Arise',
    slug: 'solo-leveling',
    description: 'Di dunia di mana para pemburu manusia harus bertarung dengan monster mematikan untuk melindungi umat manusia, Sung Jin-Woo, pemburu terlemah dari semuanya, menemukan dirinya dalam perjuangan tanpa akhir untuk bertahan hidup. Setelah selamat dari dungeon ganda yang sangat berbahaya, dia terpilih sebagai satu-satunya Player dari program misterius bernama System.',
    type: 'anime',
    status: 'ongoing',
    releaseDate: 'Januari 2024',
    studio: 'A-1 Pictures',
    rating: 8.9,
    episodeCount: 12,
    genres: ['Action', 'Adventure', 'Fantasy'],
    coverUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    isFeatured: true
  },
  {
    id: 'a2',
    title: 'Demon Slayer: Infinity Castle Arc',
    slug: 'demon-slayer-infinity-castle',
    description: 'Muzan Kibutsuji, raja iblis, memasuki Infinity Castle bersama para pengikut setianya. Tanjiro Kamado, Hashira, dan Korps Pembasmi Iblis bersiap untuk pertempuran klimaks mereka. Ini adalah awal dari pertempuran terdahsyat demi melenyapkan iblis untuk selamanya dari muka bumi.',
    type: 'anime',
    status: 'ongoing',
    releaseDate: 'Juli 2025',
    studio: 'Ufotable',
    rating: 9.2,
    episodeCount: 3,
    genres: ['Action', 'Historical', 'Supernatural'],
    coverUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&auto=format&fit=crop&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
    isFeatured: true
  },
  {
    id: 'a3',
    title: 'Frieren: Beyond Journey\'s End',
    slug: 'frieren',
    description: 'Penyihir elf Frieren dan rekan-rekan petualangnya telah mengalahkan Raja Iblis dan membawa perdamaian ke dunia. Namun, sebagai elf, Frieren ditakdirkan untuk hidup jauh lebih lama daripada teman-temannya. Bagaimana dia memaknai sisa hidupnya setelah kepergian sahabat lamanya, Himmel sang Pahlawan?',
    type: 'anime',
    status: 'completed',
    releaseDate: 'September 2023',
    studio: 'Madhouse',
    rating: 9.4,
    episodeCount: 28,
    genres: ['Adventure', 'Fantasy', 'Drama'],
    coverUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    isFeatured: true
  },
  {
    id: 'a4',
    title: 'Chainsaw Man Season 2',
    slug: 'chainsaw-man-s2',
    description: 'Melanjutkan kisah Denji, seorang pemuda miskin yang bergabung dengan Divisi Keamanan Publik sebagai Pemburu Iblis setelah bergabung dengan anjing iblisnya, Pochita. Musim ini akan menyoroti Reze Arc (Bomb Devil Arc) yang penuh misteri, aksi liar, dan patah hati.',
    type: 'anime',
    status: 'upcoming',
    releaseDate: 'Oktober 2026',
    studio: 'Mappa',
    rating: 8.8,
    episodeCount: 12,
    genres: ['Action', 'Drama', 'Supernatural'],
    coverUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&auto=format&fit=crop&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=600&auto=format&fit=crop&q=80',
    isFeatured: true
  },
  {
    id: 'a5',
    title: 'Oshi no Ko: Season 2',
    slug: 'oshi-no-ko-s2',
    description: 'Aqua dan Ruby Hoshino terus menapaki dunia hiburan yang kejam dan penuh kepalsuan demi membalas dendam atas kematian ibu mereka, Ai. Aqua bergabung dalam panggung sandiwara 2.5D untuk mendekati dalang di balik tragedi tersebut.',
    type: 'anime',
    status: 'completed',
    releaseDate: 'Juli 2024',
    studio: 'Doga Kobo',
    rating: 8.6,
    episodeCount: 13,
    genres: ['Drama', 'Supernatural', 'Mystery'],
    coverUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200&auto=format&fit=crop&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=600&auto=format&fit=crop&q=80',
    isFeatured: false
  },
  {
    id: 'a6',
    title: 'Jujutsu Kaisen Season 2',
    slug: 'jujutsu-kaisen-s2',
    description: 'Masa lalu Satoru Gojo dan Suguru Geto terungkap dalam Hidden Inventory Arc, dilanjutkan dengan insiden Shibuya yang meluluhlantakkan tatanan dunia Jujutsu. Pertarungan epik, pengorbanan tragis, dan keputusasaan menanti.',
    type: 'anime',
    status: 'completed',
    releaseDate: 'Juli 2023',
    studio: 'Mappa',
    rating: 9.0,
    episodeCount: 23,
    genres: ['Action', 'Supernatural', 'School'],
    coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    isFeatured: false
  },
  {
    id: 'a7',
    title: 'Kaiju No. 8',
    slug: 'kaiju-no-8-anime',
    description: 'Kafka Hibino, seorang pria 32 tahun yang bertugas membersihkan mayat monster (kaiju), bercita-cita bergabung dengan Pasukan Pertahanan Jepang. Suatu hari, makhluk misterius masuk ke mulutnya, memberinya kekuatan untuk berubah menjadi Kaiju setengah manusia.',
    type: 'anime',
    status: 'completed',
    releaseDate: 'April 2024',
    studio: 'Production I.G',
    rating: 8.4,
    episodeCount: 12,
    genres: ['Action', 'Sci-Fi'],
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=600&auto=format&fit=crop&q=80',
    isFeatured: false
  },
  {
    id: 'a8',
    title: 'Wind Breaker',
    slug: 'wind-breaker-anime',
    description: 'Haruka Sakura adalah siswa baru SMA Furin yang terkenal sebagai sekolah dengan berandalan terkuat, namun mereka menggunakan kekuatan tersebut untuk melindungi kota dari ancaman luar. Haruka yang hanya peduli dengan pertarungan mulai belajar arti persahabatan dan kepemimpinan.',
    type: 'anime',
    status: 'completed',
    releaseDate: 'April 2024',
    studio: 'CloverWorks',
    rating: 8.3,
    episodeCount: 12,
    genres: ['Action', 'School'],
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80',
    isFeatured: false
  }
];

// Helper to generate mock episodes
export const generateEpisodesForAnime = (animeId: string, count: number): Episode[] => {
  const episodes: Episode[] = [];
  const titles = [
    'Awal Mula Petualangan Baru',
    'Pertemuan yang Ditakdirkan',
    'Kekuatan yang Tersembunyi',
    'Ujian Berat Menanti',
    'Melampaui Batas Kemampuan',
    'Rahasia di Balik Bayangan',
    'Tekad yang Tak Tergoyahkan',
    'Pertempuran di Batas Kota',
    'Kehangatan Sahabat Sejati',
    'Kebangkitan Sang Pahlawan',
    'Badai yang Mendekat',
    'Akhir dan Awal yang Baru',
    'Melangkah ke Dunia Luar',
    'Misteri Hutan Kuno',
    'Musuh Kuat Menampakkan Diri',
    'Latihan Keras Demi Kemenangan',
    'Serangan Balasan Diluncurkan',
    'Keputusasaan dan Harapan',
    'Cahaya di Ujung Kegelapan',
    'Janji Masa Lalu',
    'Konspirasi Tingkat Tinggi',
    'Pertempuran Dua Kubu',
    'Pengorbanan yang Mulia',
    'Matahari Terbit Kembali',
    'Perjalanan Belum Berakhir',
    'Kenangan Manis yang Tersisa',
    'Menuju Medan Perang Terakhir',
    'Kedamaian Abadi'
  ];

  for (let i = 1; i <= count; i++) {
    episodes.push({
      id: `${animeId}-ep-${i}`,
      animeId,
      episodeNumber: i,
      title: titles[(i - 1) % titles.length] + ` (Bagian ${Math.ceil(i / titles.length)})`,
      duration: `${23 + (i % 3)}:${(10 + (i * 7) % 50).toString().padStart(2, '0')}`,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Safe, high-quality public test video
      subAvailable: true,
      dubAvailable: i % 3 === 0,
      thumbnailUrl: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=400&auto=format&fit=crop&q=60`
    });
  }
  return episodes;
};

export const MOCK_EPISODES: Record<string, Episode[]> = {
  'a1': generateEpisodesForAnime('a1', 12),
  'a2': generateEpisodesForAnime('a2', 3),
  'a3': generateEpisodesForAnime('a3', 28),
  'a4': generateEpisodesForAnime('a4', 0), // Upcoming, no episodes yet
  'a5': generateEpisodesForAnime('a5', 13),
  'a6': generateEpisodesForAnime('a6', 23),
  'a7': generateEpisodesForAnime('a7', 12),
  'a8': generateEpisodesForAnime('a8', 12)
};

export const MOCK_MANGAS: Manga[] = [
  {
    id: 'm1',
    title: 'Solo Leveling (Manhwa)',
    slug: 'solo-leveling-manga',
    description: 'Di dunia ini, Hunter bertugas membasmi monster di dalam Gate. Sung Jin-Woo adalah Hunter E-Rank yang sangat lemah. Setelah terjebak dalam Double Dungeon misterius, ia mendapatkan kemampuan unik bernama "System" yang memungkinkannya menaikkan level kekuatannya tanpa batas.',
    type: 'manhwa',
    status: 'completed',
    rating: 9.5,
    chapterCount: 179,
    genres: ['Action', 'Adventure', 'Fantasy'],
    coverUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
    author: 'Chugong, Dubu (Redice Studio)',
    releaseDate: '2018',
    chapters: [] // Will populate
  },
  {
    id: 'm2',
    title: 'Kaiju No. 8',
    slug: 'kaiju-no-8-manga',
    description: 'Jepang memiliki tingkat kemunculan kaiju tertinggi di dunia. Kafka Hibino bertugas membersihkan sisa-sisa kaiju setelah dikalahkan Pasukan Pertahanan. Kecewa dengan impian masa kecilnya yang kandas, seekor makhluk aneh masuk ke tubuhnya, mengubahnya menjadi monster berkekuatan dahsyat.',
    type: 'manga',
    status: 'ongoing',
    rating: 8.8,
    chapterCount: 110,
    genres: ['Action', 'Sci-Fi'],
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=1200&auto=format&fit=crop&q=80',
    author: 'Naoya Matsumoto',
    releaseDate: '2020',
    chapters: []
  },
  {
    id: 'm3',
    title: 'The Beginning After The End',
    slug: 'tbate',
    description: 'Raja Grey memiliki kekuatan, kekayaan, dan prestise yang tak tertandingi di dunia yang diatur oleh kemampuan bela diri. Namun, kesendirian membayangi mereka yang memiliki kekuasaan besar. Di bawah kulit luar seorang raja yang glamor terdapat jiwa manusia yang hampa. Bereinkarnasi ke dunia baru yang dipenuhi sihir dan monster, sang raja memiliki kesempatan kedua untuk menjalani hidupnya.',
    type: 'manhwa',
    status: 'ongoing',
    rating: 9.1,
    chapterCount: 185,
    genres: ['Adventure', 'Fantasy', 'Romance'],
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80',
    author: 'TurtleMe',
    releaseDate: '2018',
    chapters: []
  }
];

// Helper to generate chapter pages (we will make stylized panels for reading)
export const generateMangaPages = (chapterNum: number): string[] => {
  // We will generate 8 stylized placeholder panels representing manga pages
  // Each page will be a beautiful high-res image representing beautiful backgrounds/locations or drawings
  const imageIds = [
    '1578632767115-351597cf2477', // Cyberpunk street art
    '1528360983277-13d401cdc186', // Japan shrine
    '1503899036084-c55cdd92da26', // Tokyo tower neon
    '1493976040374-85c8e12f0c0e', // Temple sunset
    '1534447677768-be436bb09401', // Blue starry night
    '1518709268805-4e9042af9f23', // Medieval castle
    '1509198397868-475647b2a1e5', // Forest fog
    '1541701494587-cb58502866ab'  // Abstract lights
  ];
  return imageIds.map((id, index) => 
    `https://images.unsplash.com/photo-${id}?w=800&auto=format&fit=crop&q=80&page=${chapterNum}-${index}`
  );
};

// Populate chapters inside mock mangas
MOCK_MANGAS.forEach(manga => {
  const list = [];
  for (let i = 1; i <= 5; i++) {
    list.push({
      id: `${manga.id}-ch-${i}`,
      mangaId: manga.id,
      chapterNumber: i,
      title: `Bab ${i}: Kebangkitan Kekuatan`,
      releaseDate: `${i} Hari Lalu`,
      pages: generateMangaPages(i)
    });
  }
  manga.chapters = list;
});

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    userName: 'Kaelen_ID',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
    content: 'Wah gila sih, kualitas adaptasi Ufotable bener-bener gokil! Grafisnya makin ke sini makin nggak waras. Scene Infinity Castle beneran bikin merinding diskop.',
    timestamp: '2 jam yang lalu',
    likes: 128
  },
  {
    id: 'c2',
    userName: 'Wibu_Elite_99',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
    content: 'Sung Jin-Woo beneran definisi hunter terlemah jadi terkuat. Seneng banget akhirnya dapet versi web yang lancar jaya kayak gini, bersih tanpa iklan pop-up menyebalkan! Sukses terus NanimeID!',
    timestamp: '5 jam yang lalu',
    likes: 64
  },
  {
    id: 'c3',
    userName: 'FrierenEnthusiast',
    userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=60',
    content: 'Anime Frieren ini santai tapi dalem banget maknanya. Bikin emosional pas denger soundtracknya. Sangat direkomendasikan buat ditonton santai sore-sore.',
    timestamp: '1 hari yang lalu',
    likes: 42
  }
];
