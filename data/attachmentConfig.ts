import type { TestConfig, StandardTestResult } from "@/types/testConfig";
import {
  attachmentQuestions,
  attachmentVariantMeta,
  attachmentStyleSummaries,
  scaleOptions,
  type AttachmentStyle,
  type AttachmentTestVariant,
  type AttachmentDimension,
} from "./attachmentQuestions";

type AnswerMap = Record<number, number>;

type ScoreCard = {
  dimension: AttachmentDimension;
  label: string;
  total: number;
  answeredItems: number;
  itemIds: number[];
  avg: number;
  pct: number;
  level: string;
};

const dimensionMeta: Record<AttachmentDimension, { label: string }> = {
  anxiety: { label: "Kecemasan (Anxiety)" },
  avoidance: { label: "Penghindaran (Avoidance)" },
};

function getLevelLabel(avg: number) {
  if (avg <= 2.2) return "Rendah";
  if (avg <= 3.7) return "Sedang";
  return "Tinggi";
}

function calculateStyle(scoreCards: ScoreCard[]): AttachmentStyle {
  const anxiety = scoreCards.find((c) => c.dimension === "anxiety");
  const avoidance = scoreCards.find((c) => c.dimension === "avoidance");

  if (!anxiety || !avoidance) return "secure";

  const isAnxietyHigh = anxiety.avg > 3.0;
  const isAvoidanceHigh = avoidance.avg > 3.0;

  if (!isAnxietyHigh && !isAvoidanceHigh) return "secure";
  if (isAnxietyHigh && !isAvoidanceHigh) return "anxious";
  if (!isAnxietyHigh && isAvoidanceHigh) return "avoidant";
  return "fearful";
}

export const attachmentConfig: TestConfig<AttachmentTestVariant, AnswerMap> = {
  testSlug: "attachment",
  storageKey: "papin_res_att_v3", // upgraded storage key
  variants: ["lite", "pro"],
  
  getVariantMeta: (variant) => {
    const meta = attachmentVariantMeta[variant];
    return {
      label: meta.label,
      purpose: meta.purpose,
      questionCount: meta.questionCount,
    };
  },

  getQuestions: (variant) => {
    return attachmentQuestions
      .filter((q) => q.tier === variant)
      .map((q) => ({
        id: q.id,
        text: q.statement,
        leftLabel: "Sangat Tidak Setuju",
        rightLabel: "Sangat Setuju",
      }));
  },

  getScaleOptions: () => scaleOptions.map(o => o.value),

  calculateResult: (answers, variant) => {
    const safeAnswers = answers || {};
    const currentQuestions = attachmentQuestions.filter((q) => q.tier === variant);

    const scoreCards = (["anxiety", "avoidance"] as const).map((dim) => {
      const questions = currentQuestions.filter((q) => q.dimension === dim);
      const total = questions.reduce((sum, q) => sum + (safeAnswers[q.id] ?? 0), 0);
      const answeredItems = questions.filter((q) => safeAnswers[q.id] !== undefined).length;
      const avg = answeredItems > 0 ? total / answeredItems : 0;

      return {
        dimension: dim,
        label: dimensionMeta[dim].label,
        total,
        answeredItems,
        itemIds: questions.map((q) => q.id),
        avg,
        pct: Math.round((avg / 5) * 100),
        level: getLevelLabel(avg),
      } as ScoreCard;
    });

    const attachmentStyle = calculateStyle(scoreCards);
    const styleResult = attachmentStyleSummaries[attachmentStyle];

    if (!styleResult) {
      return {
        title: "Gaya Kelekatan",
        primaryResult: "Belum Terbaca",
        description: "Silakan isi kuesioner terlebih dahulu.",
        scoreBars: [],
        sections: [],
      };
    }

    const sections: StandardTestResult["sections"] = [
      {
        type: "tags",
        title: "Ciri Utama",
        icon: "check",
        items: styleResult.traits,
      },
      {
        type: "list",
        title: "Kelebihan",
        icon: "star",
        items: styleResult.pros,
        bgColorClass: "bg-green-50/50",
      },
    ];

    if (variant === "pro") {
      sections.push({
        type: "list",
        title: "Tantangan",
        icon: "alert",
        items: styleResult.cons,
        bgColorClass: "bg-red-50/50",
      });
    } else {
      sections.push({
        type: "text",
        title: "Buka Analisis Mendalam",
        icon: "info",
        text: "Fitur dimensi kecemasan & penghindaran secara detail, serta analisis tantangan hubungan tersedia di versi Pro.",
      });
    }

    return {
      title: "Gaya Kelekatan (Attachment Style)",
      primaryResult: styleResult.label,
      description: styleResult.shortDescription,
      tags: [styleResult.label],
      scoreBars: variant === "pro" ? scoreCards.map((c) => ({
        label: c.label,
        percentage: c.pct,
        valueText: `${c.level} (${c.avg.toFixed(1)}/5)`,
      })) : [],
      sections,
    };
  },

  getShareData: (result, variant) => {
    // Reconstruct styleResult logic based on what Share Card expects
    const traits = result.sections.find(s => s.title === "Ciri Utama")?.items || [];
    const pros = result.sections.find(s => s.title === "Kelebihan")?.items || [];

    return {
      testName: "Attachment Reflection",
      variant: variant === "lite" ? "Lite" : "Pro",
      primaryLabel: result.primaryResult,
      profileType: result.primaryResult,
      // For shortDescription we use description, assuming fullDescription is ok here too, or we can crop
      profileDescription: result.description.slice(0, 150) + "...",
      tendencyText: "", // We left tendency text out of the standard model, but it's optional
      signs: traits.slice(0, 3),
      positiveTriggers: pros.slice(0, 3),
      positiveTriggerLabel: "Kelebihanmu",
    };
  },

  getSyncPayload: (result, answers, variant) => {
    return {
      test_slug: `attachment-${variant}`,
      variant,
      answers,
      score_data: {
        label: result.primaryResult,
        scores: result.scoreBars.map((c) => ({
          dimension: c.label,
          avg: parseFloat(c.valueText?.match(/\d+\.\d+/)?.[0] || "0"),
          level: c.valueText?.split(" ")[0] || "Sedang",
        })),
      },
    };
  },
};
