import type { TestConfig, StandardTestResult } from "@/types/testConfig";
import {
  loveLanguageQuestions,
  loveLanguageVariantMeta,
  loveLanguageCategoryLabels,
  loveLanguageProfiles,
  scaleOptions,
  type LoveLanguageCategory,
  type LoveLanguageTestVariant,
} from "./loveLanguageQuestions";

type AnswerMap = Record<number, number>;

type LoveLanguageScoreCard = {
  category: LoveLanguageCategory;
  label: string;
  total: number;
  maxScore: number;
  pct: number;
  level: string;
  itemIds: number[];
  answeredItems: number;
  maxItems: number;
};

const categoryOrder: LoveLanguageCategory[] = ["words", "time", "service", "gift", "touch"];

function getMaxScore(variant: LoveLanguageTestVariant) {
  return variant === "lite" ? 10 : 20;
}

function getTieThreshold(variant: LoveLanguageTestVariant) {
  return variant === "lite" ? 1 : 2;
}

function getLevelLabel(score: number, variant: LoveLanguageTestVariant) {
  if (variant === "lite") {
    if (score <= 4) return "Rendah";
    if (score <= 7) return "Sedang";
    return "Tinggi";
  }

  if (score <= 8) return "Rendah";
  if (score <= 14) return "Sedang";
  return "Tinggi";
}

function dedupeItems(items: string[]) {
  return Array.from(new Set(items));
}

function getProfileType(scoreCards: LoveLanguageScoreCard[]) {
  const top = scoreCards[0];
  const second = scoreCards[1];
  const third = scoreCards[2];
  const bottom = scoreCards[scoreCards.length - 1];

  if (!top || !bottom) {
    return {
      label: "Belum terbaca",
      description: "Jawab lebih banyak pertanyaan dulu supaya pola love language kamu lebih stabil.",
    };
  }

  const spread = top.pct - bottom.pct;
  const topPairLead = second && third ? Math.round((top.pct + second.pct) / 2 - third.pct) : spread;
  const hasDualCore = !!second && Math.abs(top.pct - second.pct) <= 6;

  if (spread >= 24 || topPairLead >= 12) {
    return {
      label: "Focused Profile",
      description: hasDualCore
        ? `Dua love language teratasmu cukup dominan. Kamu biasanya paling peka pada ${top.label} dan ${second?.label}.`
        : `Preferensimu cukup tegas di ${top.label}, jadi bentuk kasih sayang ini biasanya terasa paling kuat buatmu.`,
    };
  }

  return {
    label: "Balanced Profile",
    description:
      "Skor kelima love language relatif berdekatan. Artinya kamu cukup fleksibel menerima kasih sayang dalam beberapa bentuk selama terasa tulus dan konsisten.",
  };
}

function getGapInsight(scoreCards: LoveLanguageScoreCard[]) {
  const top = scoreCards[0];
  const bottom = scoreCards[scoreCards.length - 1];

  if (!top || !bottom) {
    return {
      gap: 0,
      label: "Belum terbaca",
      description: "Belum ada cukup data untuk membaca seberapa tegas preferensi love language kamu.",
    };
  }

  const gap = top.pct - bottom.pct;

  if (gap >= 25) {
    return {
      gap,
      label: "Gap kuat",
      description: `Perbedaan ${gap}% menunjukkan kamu punya preferensi yang cukup tegas antara ${top.label} dan ${bottom.label}.`,
    };
  }

  if (gap >= 12) {
    return {
      gap,
      label: "Gap sedang",
      description: `Perbedaan ${gap}% menandakan ada prioritas yang cukup jelas, tapi kamu masih bisa menerima kasih sayang dalam beberapa bentuk lain.`,
    };
  }

  return {
    gap,
    label: "Relatif seimbang",
    description: `Selisih ${gap}% menunjukkan preferensimu tidak terlalu jauh. Konsistensi pasangan biasanya lebih penting daripada satu gesture tertentu.`,
  };
}

function buildBlindSpotText(
  primaryCard: LoveLanguageScoreCard,
  lowestCard: LoveLanguageScoreCard | null,
  isBilingual: boolean,
) {
  if (!lowestCard) {
    return `Karena ${primaryCard.label} terasa sangat penting buatmu, kamu bisa cepat mengira hubungan sedang dingin saat sinyal ini tidak muncul.`;
  }

  if (isBilingual) {
    return `Karena kamu punya dua bahasa yang cukup dominan, kamu bisa berharap pasangan menangkap dua kebutuhan emosional sekaligus. Saat itu tidak terjadi, kamu mungkin menganggap pasangan kurang peka, padahal ia bisa jadi sedang menunjukkan cinta lewat ${lowestCard.label} yang efeknya tidak sekuat buatmu.`;
  }

  return `Karena kamu paling peka pada ${primaryCard.label}, kamu bisa cepat menganggap hubungan sedang menjauh saat bentuk ini berkurang. Padahal pasangan mungkin tetap menunjukkan cinta lewat ${lowestCard.label}, hanya saja dampaknya tidak terasa sekuat buatmu.`;
}

function buildMissCommunicationText(
  primaryCard: LoveLanguageScoreCard,
  secondaryCard: LoveLanguageScoreCard | null,
  lowestCard: LoveLanguageScoreCard | null,
) {
  if (!lowestCard) {
    return `Saat hubungan sedang sibuk, kamu mungkin merasa pesan cinta tidak sampai kalau pasangan tidak memakai bahasa yang paling kamu rasakan.`;
  }

  return `Kamu bisa merasa pasangan "tidak nyambung" ketika ia lebih sering menunjukkan kasih sayang lewat ${lowestCard.label}, sementara kamu lebih menangkap ${primaryCard.label}${secondaryCard ? ` dan ${secondaryCard.label}` : ""}. Sebaliknya, saat kamu mengekspresikan cinta dengan cara yang menurutmu jelas, pasangan belum tentu membacanya dengan makna yang sama.`;
}

export const loveLanguageConfig: TestConfig<LoveLanguageTestVariant, AnswerMap> = {
  testSlug: "love-language",
  storageKey: "papin_res_ll_v3", // upgraded storage key to avoid breaking changes
  variants: ["lite", "pro"],
  
  getVariantMeta: (variant) => {
    const meta = loveLanguageVariantMeta[variant];
    return {
      label: meta.label,
      purpose: meta.purpose,
      questionCount: meta.questionCount,
    };
  },

  getQuestions: (variant) => {
    return loveLanguageQuestions
      .filter((q) => q.tier === variant)
      .map((q) => ({
        id: q.id,
        text: q.statement,
        leftLabel: "Tidak Penting",
        rightLabel: "Sangat Penting",
      }));
  },

  getScaleOptions: () => scaleOptions.map(o => o.value),

  calculateResult: (answers, variant) => {
    const safeAnswers = answers || {};
    const maxScore = getMaxScore(variant);

    const currentQuestions = loveLanguageQuestions.filter((q) => q.tier === variant);

    const scoreCards = categoryOrder
      .map((category) => {
        const questions = currentQuestions.filter((q) => q.category === category);
        const total = questions.reduce((sum, q) => sum + (safeAnswers[q.id] ?? 0), 0);
        const answeredItems = questions.filter((q) => safeAnswers[q.id] !== undefined).length;

        return {
          category,
          label: loveLanguageCategoryLabels[category],
          total,
          maxScore,
          pct: Math.round((total / maxScore) * 100),
          level: getLevelLabel(total, variant),
          itemIds: questions.map((q) => q.id),
          answeredItems,
          maxItems: questions.length,
        };
      })
      .sort((a, b) => b.total - a.total);

    const primaryCard = scoreCards[0];
    const secondaryCard = scoreCards[1];
    const lowestCard = scoreCards[scoreCards.length - 1];

    const isBilingual =
      !!primaryCard &&
      !!secondaryCard &&
      Math.abs(primaryCard.total - secondaryCard.total) <= getTieThreshold(variant);

    const primaryProfile = primaryCard ? loveLanguageProfiles[primaryCard.category] : null;
    const secondaryProfile = secondaryCard ? loveLanguageProfiles[secondaryCard.category] : null;

    const profileType = getProfileType(scoreCards);
    const gapInsight = getGapInsight(scoreCards);

    const positiveTriggers = dedupeItems([
      ...(primaryProfile?.appreciatedWhen ?? []),
      ...(secondaryProfile?.appreciatedWhen ?? []),
    ]).slice(0, 3);

    const isPro = variant === "pro";

    const sections: StandardTestResult["sections"] = [];
    
    // Pro features
    if (isPro) {
      if (primaryCard) {
        sections.push({
          type: "text",
          title: "Potential Blind Spot",
          icon: "alert",
          text: buildBlindSpotText(primaryCard, lowestCard, isBilingual),
          bgColorClass: "bg-primary/5",
        });
        
        sections.push({
          type: "text",
          title: "The Gap Insight",
          icon: "info",
          text: gapInsight.description,
          bgColorClass: "bg-primary/5",
        });

        sections.push({
          type: "text",
          title: "Miscommunication Risk",
          icon: "alert",
          text: buildMissCommunicationText(primaryCard, secondaryCard, lowestCard),
          bgColorClass: "bg-primary/5",
        });
      }
    } else {
      sections.push({
        type: "text",
        title: "Buka Analisis Mendalam",
        icon: "info",
        text: "Dapatkan insight tentang Blind Spot, Gap analisis, dan risiko miskomunikasi dengan pasangan di versi Pro.",
      });
    }

    return {
      title: "Ranking Bahasa Kasih",
      primaryResult: isBilingual ? "Dua Bahasa Dominan" : (primaryCard?.label || "Belum Terbaca"),
      description: profileType.description,
      tags: [profileType.label],
      scoreBars: scoreCards.map((c) => ({
        label: c.label,
        percentage: c.pct,
        valueText: `${c.pct}%`,
      })),
      sections,
    };
  },

  getShareData: (result, variant) => {
    // Note: To match EXACTLY what's expected by ShareResultCard, we will construct the object similarly
    const scoreCards = result.scoreBars;
    const isBilingual = result.primaryResult === "Dua Bahasa Dominan";
    const primaryLabel = isBilingual ? scoreCards[0]?.label || "" : result.primaryResult;
    const secondaryLabel = isBilingual ? scoreCards[1]?.label || undefined : undefined;

    return {
      testName: "Love Language Mapping",
      variant: variant === "lite" ? "Lite" : "Pro",
      primaryLabel,
      secondaryLabel,
      isBilingual,
      profileType: result.tags?.[0] || "",
      profileDescription: result.description,
      signs: [],
      positiveTriggers: [],
      // For simplicity, we just pass gapPct as the diff of first and last
      gapPct: (scoreCards[0]?.percentage || 0) - (scoreCards[4]?.percentage || 0),
    };
  },

  getSyncPayload: (result, answers, variant) => {
    // Return exactly what was sent previously
    const scoreBars = result.scoreBars;
    return {
      test_slug: `love-language-${variant}`,
      variant,
      score_data: {
        primary: scoreBars[0]?.label,
        secondary: scoreBars[1]?.label,
        scores: scoreBars.map((c) => ({ label: c.label, pct: c.percentage })),
      },
      answers,
    };
  },
};
