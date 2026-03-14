export type AccessState = "free" | "unlocked_by_subscription" | "purchased" | "locked";

export type TestCatalogRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  is_active: boolean;
};

export const publicFocusTestSlugs = [
  "attachment-lite",
  "attachment-pro",
  "love-language-lite",
  "love-language-pro",
] as const;

const publicFocusSlugSet = new Set<string>(publicFocusTestSlugs);

export const isPublicTestVisible = (slug: string) => publicFocusSlugSet.has(slug);

export const filterPublicCatalogRows = <T extends TestCatalogRow>(tests: T[]) =>
  tests.filter((test) => isPublicTestVisible(test.slug));

export const fallbackCatalog: TestCatalogRow[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "attachment-lite",
    title: "Attachment Reflection Lite",
    description: "Versi free dengan 8 soal untuk self-awareness cepat berbasis attachment anxiety dan avoidance.",
    price: 0,
    is_free: true,
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    slug: "attachment-pro",
    title: "Attachment Reflection Pro",
    description: "Versi lebih mendalam dengan 24 soal, dua dimensi inti, dan reverse scoring untuk hasil refleksi yang lebih kaya.",
    price: 25000,
    is_free: false,
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    slug: "love-language-lite",
    title: "Love Language Mapping Lite",
    description: "Versi cepat 10 soal untuk membaca bahasa cinta utama dengan UX ringan dan mobile-friendly.",
    price: 0,
    is_free: true,
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    slug: "love-language-pro",
    title: "Love Language Mapping Pro",
    description: "Versi lebih mendalam 20 soal untuk membaca primary dan secondary love language dengan profil yang lebih stabil.",
    price: 25000,
    is_free: false,
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    slug: "conflict-style",
    title: "Conflict Style Check",
    description: "Melihat gaya respons saat konflik agar diskusi pasangan lebih sehat. Coming soon.",
    price: 25000,
    is_free: false,
    is_active: false,
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    slug: "emotional-needs",
    title: "Emotional Needs Check",
    description: "Memetakan kebutuhan emosional inti untuk relasi yang lebih aman. Coming soon.",
    price: 25000,
    is_free: false,
    is_active: false,
  },
];
