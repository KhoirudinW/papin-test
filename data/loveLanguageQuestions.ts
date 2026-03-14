export type LoveLanguageTestVariant = "lite" | "pro";

export type LoveLanguageCategory = "words" | "time" | "service" | "gift" | "touch";

export type LoveLanguageQuestion = {
  id: number;
  tier: LoveLanguageTestVariant;
  statement: string;
  category: LoveLanguageCategory;
};

export const loveLanguageVariantMeta: Record<
  LoveLanguageTestVariant,
  {
    label: string;
    badge: string;
    questionCount: number;
    purpose: string;
    description: string;
  }
> = {
  lite: {
    label: "Lite",
    badge: "Free",
    questionCount: 10,
    purpose: "UX cepat",
    description: "10 soal inti, 2 item untuk tiap love language agar user bisa selesai cepat di mobile.",
  },
  pro: {
    label: "Pro",
    badge: "Medium Depth",
    questionCount: 20,
    purpose: "Assessment lebih stabil",
    description: "20 soal dengan 4 item per love language untuk membaca profil yang sedikit lebih akurat.",
  },
};

export const loveLanguageCategoryLabels: Record<LoveLanguageCategory, string> = {
  words: "Words of Affirmation",
  time: "Quality Time",
  service: "Acts of Service",
  gift: "Receiving Gifts",
  touch: "Physical Touch",
};

export const loveLanguageProfiles: Record<
  LoveLanguageCategory,
  {
    shortDescription: string;
    signs: string[];
    appreciatedWhen: string[];
    watchOuts: string[];
    partnerActions: string[];
    userShowsLove: string[];
    communicationTip: string;
  }
> = {
  words: {
    shortDescription:
      "Kamu paling terasa dicintai saat kasih sayang diungkapkan dengan jelas lewat kata-kata, pujian, dan validasi verbal.",
    signs: [
      "Ucapan dukungan kecil bisa sangat mengangkat mood kamu.",
      "Pujian yang tulus terasa sangat berkesan.",
      "Nada bicara pasangan sering lebih kamu ingat daripada detail lain.",
    ],
    appreciatedWhen: [
      "Pasangan bilang bangga, terima kasih, atau menghargai usahamu.",
      "Ada kata-kata dukungan saat kamu lagi capek atau ragu.",
      "Perasaan sayang tidak dibiarkan cuma tersirat, tetapi juga diucapkan.",
    ],
    watchOuts: [
      "Kata-kata yang manis tapi tidak konsisten dengan tindakan bisa terasa kosong.",
      "Respons verbal yang dingin atau datar bisa terasa lebih menyakitkan buat kamu.",
    ],
    partnerActions: [
      "Ucapkan apresiasi yang spesifik setelah melihat usaha atau pencapaianmu.",
      "Kirim pesan singkat yang hangat saat kamu sedang capek, cemas, atau butuh semangat.",
      "Jelaskan rasa sayang dan bangga secara langsung, jangan cuma diasumsikan kamu sudah tahu.",
    ],
    userShowsLove: [
      "Kamu cenderung menunjukkan cinta lewat pujian, validasi, dan kalimat yang menguatkan.",
      "Saat sayang, kamu biasanya ingin pasangan benar-benar tahu bahwa ia dihargai dan dibutuhkan.",
      "Kamu sering mengekspresikan perhatian lewat chat, ucapan, atau afirmasi yang jelas.",
    ],
    communicationTip:
      'Coba sampaikan kebutuhanmu secara spesifik, misalnya: "Aku paling merasa dekat kalau kamu bilang langsung apa yang kamu hargai dari aku."',
  },
  time: {
    shortDescription:
      "Kamu paling merasa dekat ketika pasangan hadir penuh, memberi perhatian utuh, dan meluangkan waktu khusus bersama.",
    signs: [
      "Waktu berdua tanpa distraksi terasa sangat penting.",
      "Percakapan mendalam biasanya lebih kamu hargai daripada gesture cepat.",
      "Kehadiran penuh pasangan sering lebih berarti daripada hadiah.",
    ],
    appreciatedWhen: [
      "Pasangan benar-benar fokus saat ngobrol atau quality time.",
      "Ada momen khusus berdua tanpa distraksi gadget atau kerjaan lain.",
      "Aktivitas sederhana bersama terasa hangat karena dilakukan dengan penuh perhatian.",
    ],
    watchOuts: [
      "Kamu bisa cepat merasa diabaikan saat waktu bersama sering terpotong hal lain.",
      "Kehadiran fisik tanpa perhatian emosional biasanya belum cukup buat kamu.",
    ],
    partnerActions: [
      "Sisihkan waktu berdua tanpa gadget atau distraksi lain, meski hanya sebentar tapi benar-benar fokus.",
      "Buat momen rutin yang khusus untuk kalian berdua supaya kamu merasa diprioritaskan.",
      "Saat ngobrol, beri atensi penuh dan jangan multitasking agar kamu merasa benar-benar ditemani.",
    ],
    userShowsLove: [
      "Kamu biasanya menunjukkan cinta dengan menyediakan waktu, hadir penuh, dan benar-benar mendengarkan.",
      "Buatmu, kebersamaan yang konsisten sering terasa lebih romantis daripada gesture besar yang jarang.",
      "Saat sayang, kamu cenderung ingin membangun koneksi lewat aktivitas atau percakapan bersama.",
    ],
    communicationTip:
      'Kalau kamu butuh koneksi, coba bilang: "Aku paling merasa dicintai kalau kita punya waktu khusus berdua tanpa distraksi."',
  },
  service: {
    shortDescription:
      "Kamu paling merasa dicintai lewat tindakan nyata yang meringankan beban dan menunjukkan kepedulian praktis.",
    signs: [
      "Bantuan kecil terasa sangat berarti buat kamu.",
      "Kamu mudah tersentuh saat pasangan inisiatif membantu tanpa diminta.",
      "Aksi nyata sering terasa lebih meyakinkan daripada janji atau kata-kata.",
    ],
    appreciatedWhen: [
      "Pasangan membantu tugas atau tanggung jawab yang lagi berat.",
      "Ada tindakan kecil yang membuat harimu terasa lebih ringan.",
      "Perhatian terlihat lewat aksi, bukan hanya niat yang diucapkan.",
    ],
    watchOuts: [
      "Kamu bisa merasa kecewa saat pasangan banyak bicara tapi minim tindakan.",
      "Sering kali kamu menilai rasa sayang dari konsistensi aksi sehari-hari.",
    ],
    partnerActions: [
      "Ambil inisiatif membantu hal kecil yang sedang membebanimu tanpa harus diminta berkali-kali.",
      "Tunjukkan kepedulian lewat aksi konkret yang membuat harimu lebih ringan.",
      "Tepati bantuan yang sudah dijanjikan supaya kamu merasa diperhatikan secara nyata.",
    ],
    userShowsLove: [
      "Kamu cenderung mengekspresikan cinta lewat bantuan konkret dan aksi yang mempermudah hidup pasangan.",
      "Saat sayang, kamu lebih memilih membantu menyelesaikan masalah daripada hanya memberi kata-kata manis.",
      "Buatmu, perhatian sering terasa paling tulus ketika diwujudkan dalam tindakan sehari-hari.",
    ],
    communicationTip:
      'Saat menyampaikan kebutuhan, kamu bisa bilang: "Aku merasa paling dibantu kalau perhatianmu terlihat lewat tindakan kecil yang nyata."',
  },
  gift: {
    shortDescription:
      "Kamu paling merasa diperhatikan saat menerima simbol kasih sayang yang dipikirkan dengan tulus dan personal.",
    signs: [
      "Hadiah kecil yang bermakna bisa bertahan lama di ingatan kamu.",
      "Kamu sering menyukai benda yang mengingatkan pada pasangan.",
      "Perhatian dalam memilih hadiah terasa lebih penting daripada harga barangnya.",
    ],
    appreciatedWhen: [
      "Pasangan memberi sesuatu yang terasa personal dan dipikirkan baik-baik.",
      "Ada simbol kecil yang menunjukkan pasangan ingat pada kamu.",
      "Momen spesial terasa lebih hangat dengan gesture berupa pemberian.",
    ],
    watchOuts: [
      "Orang lain bisa salah paham dan mengira kamu materialistis, padahal yang kamu cari adalah makna perhatian.",
      "Hadiah yang asal-asalan biasanya justru terasa kurang menyentuh buat kamu.",
    ],
    partnerActions: [
      "Berikan simbol kecil yang personal dan terasa dipilih khusus untukmu, bukan yang asal ada.",
      "Ingat detail kecil tentang apa yang kamu suka lalu ubah jadi gesture sederhana yang bermakna.",
      "Gunakan hadiah kecil sebagai cara menunjukkan bahwa pasangan ingat dan memikirkanmu.",
    ],
    userShowsLove: [
      "Kamu sering menunjukkan cinta lewat pemberian kecil yang terasa personal dan penuh niat.",
      "Saat sayang, kamu cenderung ingin memberi simbol yang bisa dikenang pasangan.",
      "Buatmu, detail kecil yang dipilih dengan hati sering menjadi bahasa perhatian yang kuat.",
    ],
    communicationTip:
      'Kalau perlu menjelaskan kebutuhanmu, kamu bisa bilang: "Aku senang saat kamu memberi tanda kecil yang menunjukkan kamu ingat dan memikirkan aku."',
  },
  touch: {
    shortDescription:
      "Kamu paling merasa aman, dekat, dan dicintai lewat sentuhan fisik yang hangat dan menenangkan.",
    signs: [
      "Pelukan, genggaman tangan, atau sentuhan kecil sangat berpengaruh ke rasa amanmu.",
      "Kedekatan fisik sering membantu kamu merasa terkoneksi lagi.",
      "Afeksi nonverbal terasa sama pentingnya dengan komunikasi verbal.",
    ],
    appreciatedWhen: [
      "Pasangan menunjukkan kasih sayang lewat pelukan, sentuhan, atau kedekatan fisik yang hangat.",
      "Ada kontak fisik kecil yang membuat kamu merasa diperhatikan.",
      "Sentuhan membantu kamu merasa lebih tenang saat hubungan sedang menegang.",
    ],
    watchOuts: [
      "Kurangnya afeksi fisik bisa cepat terasa sebagai jarak emosional.",
      "Kamu mungkin lebih sensitif terhadap penolakan sentuhan daripada orang lain.",
    ],
    partnerActions: [
      "Berikan pelukan, genggaman tangan, atau sentuhan kecil yang hangat saat bertemu atau berpamitan.",
      "Gunakan sentuhan lembut untuk menenangkanmu saat kamu sedang tegang atau overthinking.",
      "Bangun kebiasaan afeksi fisik yang konsisten supaya kamu merasa aman dan dekat.",
    ],
    userShowsLove: [
      "Kamu cenderung menunjukkan cinta lewat kedekatan fisik, pelukan, dan sentuhan yang menenangkan.",
      "Saat sayang, kamu biasanya lebih mudah membangun koneksi lewat afeksi nonverbal.",
      "Buatmu, kehangatan sentuhan sering menjadi cara tercepat untuk menyampaikan rasa aman.",
    ],
    communicationTip:
      'Kalau ingin lebih dimengerti, kamu bisa bilang: "Aku biasanya merasa lebih tenang dan dekat kalau ada sentuhan hangat dari kamu."',
  },
};

export const scaleOptions = [
  { value: 1, code: "1", label: "Sangat tidak setuju" },
  { value: 2, code: "2", label: "Tidak setuju" },
  { value: 3, code: "3", label: "Netral" },
  { value: 4, code: "4", label: "Setuju" },
  { value: 5, code: "5", label: "Sangat setuju" },
];

export const loveLanguageQuestions: LoveLanguageQuestion[] = [
  {
    id: 1,
    tier: "lite",
    statement: "Saya merasa sangat dicintai ketika pasangan mengatakan hal positif tentang saya.",
    category: "words",
  },
  {
    id: 2,
    tier: "lite",
    statement: "Kata-kata dukungan dari pasangan membuat saya merasa lebih dihargai.",
    category: "words",
  },
  {
    id: 3,
    tier: "lite",
    statement: "Waktu berkualitas berdua tanpa gangguan sangat penting bagi saya.",
    category: "time",
  },
  {
    id: 4,
    tier: "lite",
    statement: "Saya merasa lebih dekat ketika pasangan benar-benar fokus pada saya saat bersama.",
    category: "time",
  },
  {
    id: 5,
    tier: "lite",
    statement: "Saya merasa dicintai ketika pasangan membantu pekerjaan atau tanggung jawab saya.",
    category: "service",
  },
  {
    id: 6,
    tier: "lite",
    statement: "Tindakan nyata lebih bermakna bagi saya dibanding sekadar kata-kata.",
    category: "service",
  },
  {
    id: 7,
    tier: "lite",
    statement: "Hadiah kecil yang dipikirkan dengan baik membuat saya merasa dihargai.",
    category: "gift",
  },
  {
    id: 8,
    tier: "lite",
    statement: "Saya merasa dicintai ketika pasangan memberi sesuatu sebagai tanda perhatian.",
    category: "gift",
  },
  {
    id: 9,
    tier: "lite",
    statement: "Sentuhan seperti pelukan atau pegangan tangan membuat saya merasa dicintai.",
    category: "touch",
  },
  {
    id: 10,
    tier: "lite",
    statement: "Kontak fisik dari pasangan memberi rasa aman dan kedekatan.",
    category: "touch",
  },
  {
    id: 1,
    tier: "pro",
    statement: "Saya merasa sangat dihargai ketika pasangan memuji usaha saya.",
    category: "words",
  },
  {
    id: 2,
    tier: "pro",
    statement: "Kata-kata dukungan dari pasangan memberi saya semangat.",
    category: "words",
  },
  {
    id: 3,
    tier: "pro",
    statement: "Mendengar pasangan mengatakan \"aku bangga padamu\" sangat berarti bagi saya.",
    category: "words",
  },
  {
    id: 4,
    tier: "pro",
    statement: "Saya merasa lebih dicintai ketika pasangan mengungkapkan perasaan secara verbal.",
    category: "words",
  },
  {
    id: 5,
    tier: "pro",
    statement: "Saya merasa dicintai ketika pasangan meluangkan waktu khusus hanya untuk saya.",
    category: "time",
  },
  {
    id: 6,
    tier: "pro",
    statement: "Percakapan mendalam dengan pasangan sangat berarti bagi saya.",
    category: "time",
  },
  {
    id: 7,
    tier: "pro",
    statement: "Saya merasa kecewa jika waktu bersama terganggu oleh hal lain.",
    category: "time",
  },
  {
    id: 8,
    tier: "pro",
    statement: "Aktivitas sederhana bersama pasangan membuat saya merasa dekat.",
    category: "time",
  },
  {
    id: 9,
    tier: "pro",
    statement: "Saya merasa dicintai ketika pasangan membantu pekerjaan saya.",
    category: "service",
  },
  {
    id: 10,
    tier: "pro",
    statement: "Ketika pasangan melakukan sesuatu untuk meringankan beban saya, saya merasa dihargai.",
    category: "service",
  },
  {
    id: 11,
    tier: "pro",
    statement: "Bantuan praktis lebih bermakna bagi saya dibanding hadiah.",
    category: "service",
  },
  {
    id: 12,
    tier: "pro",
    statement: "Saya merasa dicintai ketika pasangan melakukan sesuatu untuk saya tanpa diminta.",
    category: "service",
  },
  {
    id: 13,
    tier: "pro",
    statement: "Saya merasa diperhatikan ketika menerima hadiah dari pasangan.",
    category: "gift",
  },
  {
    id: 14,
    tier: "pro",
    statement: "Hadiah kecil yang bermakna bisa membuat saya sangat bahagia.",
    category: "gift",
  },
  {
    id: 15,
    tier: "pro",
    statement: "Saya suka menyimpan benda yang mengingatkan saya pada pasangan.",
    category: "gift",
  },
  {
    id: 16,
    tier: "pro",
    statement: "Memberi hadiah pada momen spesial membuat hubungan terasa lebih berarti bagi saya.",
    category: "gift",
  },
  {
    id: 17,
    tier: "pro",
    statement: "Pelukan dari pasangan membuat saya merasa dicintai.",
    category: "touch",
  },
  {
    id: 18,
    tier: "pro",
    statement: "Sentuhan kecil seperti menggenggam tangan membuat saya merasa dekat.",
    category: "touch",
  },
  {
    id: 19,
    tier: "pro",
    statement: "Kontak fisik membantu saya merasa aman dalam hubungan.",
    category: "touch",
  },
  {
    id: 20,
    tier: "pro",
    statement: "Saya merasa lebih terhubung ketika pasangan menunjukkan kasih sayang lewat sentuhan.",
    category: "touch",
  },
];
