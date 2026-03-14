export type AttachmentTestVariant = "lite" | "pro";

export type AttachmentDimension = "anxiety" | "avoidance";

export type AttachmentStyle = "secure" | "anxious" | "avoidant" | "fearful";

export type AttachmentQuestion = {
  id: number;
  tier: AttachmentTestVariant;
  statement: string;
  dimension: AttachmentDimension;
  reverse?: boolean;
};

export const attachmentVariantMeta: Record<
  AttachmentTestVariant,
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
    questionCount: 8,
    purpose: "Self-awareness cepat",
    description: "Versi singkat untuk membaca kecenderungan awal attachment lewat 8 soal inti.",
  },
  pro: {
    label: "Pro",
    badge: "Akurat",
    questionCount: 24,
    purpose: "Refleksi lebih dalam",
    description: "Versi lebih lengkap dengan 24 soal, dua dimensi inti, dan item reverse scoring.",
  },
};

export const attachmentDimensionLabels: Record<AttachmentDimension, string> = {
  anxiety: "Attachment Anxiety",
  avoidance: "Attachment Avoidance",
};

export const attachmentDimensionDescriptions: Record<AttachmentDimension, string[]> = {
  anxiety: [
    "Menggambarkan seberapa kuat kebutuhan reassurance dan rasa aman dari respons pasangan.",
    "Skor lebih tinggi biasanya muncul saat seseorang lebih sensitif terhadap jarak, perubahan respons, atau kemungkinan penolakan.",
  ],
  avoidance: [
    "Menggambarkan seberapa kuat dorongan menjaga kemandirian emosional dan jarak dalam hubungan.",
    "Skor lebih tinggi biasanya muncul saat seseorang kurang nyaman pada kedekatan yang terlalu intens atau ketergantungan emosional.",
  ],
};

export const attachmentStyleSummaries: Record<
  AttachmentStyle,
  {
    label: string;
    shortDescription: string;
    tendency: string;
    traits: string[];
    pros: string[];
    cons: string[];
    compatibleWith: string[];
  }
> = {
  secure: {
    label: "Secure",
    shortDescription:
      "Cukup nyaman dengan kedekatan, tetap stabil, dan tidak terlalu mudah panik saat dinamika hubungan berubah.",
    tendency: "Kamu cenderung cukup nyaman dengan kedekatan sekaligus tetap stabil menjaga ruang pribadi.",
    traits: [
      "Biasanya lebih tenang membaca dinamika hubungan.",
      "Lebih mudah dekat tanpa merasa terlalu terancam.",
      "Cenderung bisa meminta dan memberi dukungan secara seimbang.",
    ],
    pros: [
      "Komunikasi biasanya lebih stabil dan terbuka.",
      "Lebih mudah membangun rasa aman dua arah.",
      "Cenderung tidak cepat defensif saat hubungan diuji.",
    ],
    cons: [
      "Kadang bisa terlihat terlalu tenang bagi pasangan yang sangat butuh reassurance.",
      "Bisa kurang sadar kalau pasangan sedang butuh validasi ekstra.",
    ],
    compatibleWith: [
      "Secure, karena ritmenya sama-sama stabil.",
      "Anxious, jika komunikasi dan reassurance dijaga dengan konsisten.",
      "Avoidant, jika ada ruang pribadi yang sehat dan komunikasi tetap hangat.",
    ],
  },
  anxious: {
    label: "Anxious",
    shortDescription:
      "Lebih sensitif terhadap perubahan respons pasangan dan cenderung mencari kepastian emosional lebih sering.",
    tendency: "Kamu cenderung lebih sensitif terhadap tanda-tanda jarak dan lebih membutuhkan kepastian emosional.",
    traits: [
      "Mudah overthinking saat respons pasangan berubah.",
      "Sering merasa lebih tenang setelah mendapat reassurance.",
      "Kebutuhan kedekatan bisa terasa sangat penting untuk rasa aman.",
    ],
    pros: [
      "Sangat peduli pada kedekatan emosional.",
      "Peka terhadap perubahan kecil dalam relasi.",
      "Biasanya punya keinginan kuat untuk menjaga hubungan tetap hidup.",
    ],
    cons: [
      "Mudah kelelahan secara emosional saat komunikasi tidak jelas.",
      "Bisa menafsirkan jarak kecil sebagai ancaman besar.",
      "Rentan mencari reassurance berulang saat sedang tidak aman.",
    ],
    compatibleWith: [
      "Secure, karena cenderung bisa memberi rasa aman yang konsisten.",
      "Anxious, tapi butuh regulasi emosi yang lebih matang agar tidak saling memicu.",
    ],
  },
  avoidant: {
    label: "Avoidant",
    shortDescription:
      "Lebih menjaga kemandirian emosional dan cenderung mundur saat hubungan terasa terlalu intens atau menuntut.",
    tendency: "Kamu cenderung menjaga kemandirian emosional dan bisa merasa tidak nyaman saat hubungan terasa terlalu intens.",
    traits: [
      "Lebih nyaman memproses banyak hal sendiri.",
      "Bisa menahan perasaan saat situasi terasa terlalu dekat.",
      "Sering membutuhkan ruang pribadi yang jelas agar tetap nyaman.",
    ],
    pros: [
      "Biasanya mandiri dan tidak mudah panik.",
      "Sering mampu berpikir jernih saat situasi emosional memanas.",
      "Punya batas pribadi yang cukup jelas.",
    ],
    cons: [
      "Bisa sulit terlihat hadir secara emosional bagi pasangan.",
      "Cenderung menarik diri saat hubungan justru butuh kedekatan.",
      "Sering menahan kebutuhan atau perasaan terlalu lama.",
    ],
    compatibleWith: [
      "Secure, jika pasangan menghargai ruang pribadi tanpa kehilangan koneksi.",
      "Avoidant, tetapi perlu usaha ekstra agar hubungan tidak terasa terlalu jauh.",
    ],
  },
  fearful: {
    label: "Fearful",
    shortDescription: "Bisa sama-sama ingin dekat dan takut dekat, sehingga dinamika hubungan kadang terasa tarik-ulur.",
    tendency: "Kamu bisa sama-sama menginginkan kedekatan dan merasa waspada terhadap kedekatan itu sendiri.",
    traits: [
      "Kadang ingin sangat dekat, tetapi juga cepat merasa tidak aman.",
      "Respons emosional bisa terasa tarik-ulur saat hubungan menegang.",
      "Butuh rasa aman sekaligus batas yang sehat agar hubungan terasa lebih stabil.",
    ],
    pros: [
      "Punya kebutuhan kedekatan yang dalam dan nyata.",
      "Sering reflektif terhadap hubungan karena sadar ada konflik batin internal.",
      "Bisa berkembang pesat jika relasi terasa aman dan konsisten.",
    ],
    cons: [
      "Mudah bingung antara ingin mendekat atau menjauh.",
      "Rentan merasa lelah karena konflik batin sendiri.",
      "Bisa memicu pola push-pull yang membingungkan pasangan.",
    ],
    compatibleWith: [
      "Secure, karena biasanya paling membantu menciptakan stabilitas dan rasa aman.",
      "Fearful, tetapi butuh komunikasi dan regulasi emosi yang sangat baik agar tidak saling memicu.",
    ],
  },
};

export const scaleOptions = [
  { value: 1, code: "1", label: "Sangat tidak sesuai" },
  { value: 2, code: "2", label: "Tidak sesuai" },
  { value: 3, code: "3", label: "Kadang sesuai" },
  { value: 4, code: "4", label: "Sesuai" },
  { value: 5, code: "5", label: "Sangat sesuai" },
];

export const attachmentQuestions: AttachmentQuestion[] = [
  { id: 1, tier: "lite", statement: "Saya sering khawatir pasangan saya akan kehilangan minat pada saya.", dimension: "anxiety" },
  {
    id: 2,
    tier: "lite",
    statement: "Saya merasa tidak tenang jika tidak tahu bagaimana perasaan pasangan terhadap saya.",
    dimension: "anxiety",
  },
  {
    id: 3,
    tier: "lite",
    statement: "Ketika pasangan tidak merespons pesan saya cukup lama, saya mudah merasa cemas.",
    dimension: "anxiety",
  },
  {
    id: 4,
    tier: "lite",
    statement: "Saya sering membutuhkan kepastian bahwa pasangan masih mencintai saya.",
    dimension: "anxiety",
  },
  { id: 5, tier: "lite", statement: "Saya merasa tidak nyaman terlalu bergantung pada pasangan.", dimension: "avoidance" },
  {
    id: 6,
    tier: "lite",
    statement: "Saya lebih suka menyelesaikan masalah sendiri daripada berbagi dengan pasangan.",
    dimension: "avoidance",
  },
  {
    id: 7,
    tier: "lite",
    statement: "Percakapan emosional yang terlalu dalam sering membuat saya tidak nyaman.",
    dimension: "avoidance",
  },
  { id: 8, tier: "lite", statement: "Saya cenderung menjaga jarak emosional dalam hubungan.", dimension: "avoidance" },
  { id: 1, tier: "pro", statement: "Saya sering khawatir pasangan saya akan kehilangan minat pada saya.", dimension: "anxiety" },
  { id: 2, tier: "pro", statement: "Saya membutuhkan reassurance bahwa pasangan saya masih mencintai saya.", dimension: "anxiety" },
  {
    id: 3,
    tier: "pro",
    statement: "Saya mudah merasa tidak aman ketika pasangan terlihat lebih sibuk dari biasanya.",
    dimension: "anxiety",
  },
  { id: 4, tier: "pro", statement: "Saya sering memikirkan hubungan saya secara berlebihan.", dimension: "anxiety" },
  { id: 5, tier: "pro", statement: "Saya takut hubungan saya bisa berakhir secara tiba-tiba.", dimension: "anxiety" },
  {
    id: 6,
    tier: "pro",
    statement: "Saya merasa sangat terganggu ketika pasangan terlihat menjauh secara emosional.",
    dimension: "anxiety",
  },
  { id: 7, tier: "pro", statement: "Saya sering merasa tidak cukup baik untuk pasangan saya.", dimension: "anxiety" },
  { id: 8, tier: "pro", statement: "Ketika pasangan tidak merespons pesan saya, saya mudah merasa cemas.", dimension: "anxiety" },
  {
    id: 9,
    tier: "pro",
    statement: "Saya sering bertanya pada diri sendiri apakah pasangan saya benar-benar peduli pada saya.",
    dimension: "anxiety",
  },
  {
    id: 10,
    tier: "pro",
    statement: "Saya merasa sangat tenang ketika pasangan memberikan kepastian tentang hubungan.",
    dimension: "anxiety",
  },
  {
    id: 11,
    tier: "pro",
    statement: "Perasaan aman saya dalam hubungan sangat bergantung pada respons pasangan.",
    dimension: "anxiety",
  },
  { id: 12, tier: "pro", statement: "Saya jarang merasa khawatir tentang hubungan saya.", dimension: "anxiety", reverse: true },
  { id: 13, tier: "pro", statement: "Saya merasa tidak nyaman terlalu bergantung pada pasangan.", dimension: "avoidance" },
  {
    id: 14,
    tier: "pro",
    statement: "Saya lebih suka mengandalkan diri sendiri daripada meminta dukungan emosional.",
    dimension: "avoidance",
  },
  {
    id: 15,
    tier: "pro",
    statement: "Saya merasa tidak nyaman jika pasangan ingin terlalu dekat secara emosional.",
    dimension: "avoidance",
  },
  { id: 16, tier: "pro", statement: "Saya sulit menunjukkan sisi rentan saya kepada pasangan.", dimension: "avoidance" },
  { id: 17, tier: "pro", statement: "Saya cenderung menjaga jarak emosional dalam hubungan.", dimension: "avoidance" },
  {
    id: 18,
    tier: "pro",
    statement: "Percakapan emosional yang terlalu dalam sering membuat saya tidak nyaman.",
    dimension: "avoidance",
  },
  { id: 19, tier: "pro", statement: "Saya merasa lebih aman jika tetap mandiri dalam hubungan.", dimension: "avoidance" },
  { id: 20, tier: "pro", statement: "Saya merasa hubungan yang terlalu intens bisa melelahkan.", dimension: "avoidance" },
  {
    id: 21,
    tier: "pro",
    statement: "Saya tidak selalu merasa perlu berbagi semua perasaan saya kepada pasangan.",
    dimension: "avoidance",
  },
  {
    id: 22,
    tier: "pro",
    statement: "Saya merasa nyaman bergantung pada pasangan dalam hal emosional.",
    dimension: "avoidance",
    reverse: true,
  },
  { id: 23, tier: "pro", statement: "Saya sering menarik diri ketika hubungan terasa terlalu dekat.", dimension: "avoidance" },
  {
    id: 24,
    tier: "pro",
    statement: "Saya merasa hubungan yang sehat tetap membutuhkan ruang pribadi yang besar.",
    dimension: "avoidance",
  },
];
