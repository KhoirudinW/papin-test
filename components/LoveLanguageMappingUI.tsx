"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, ChevronLeft, ChevronRight, HeartHandshake } from "lucide-react";
import {
  loveLanguageCategoryLabels,
  loveLanguageProfiles,
  loveLanguageQuestions,
  loveLanguageVariantMeta,
  scaleOptions,
  type LoveLanguageCategory,
  type LoveLanguageTestVariant,
} from "@/data/loveLanguageQuestions";

type AnswerMap = Record<number, number>;
type AnswersByVariant = Record<LoveLanguageTestVariant, AnswerMap>;
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

function buildLeastFeltSummary(primaryCard: LoveLanguageScoreCard, lowestCard: LoveLanguageScoreCard | null) {
  if (!lowestCard) {
    return `Belum ada cukup data untuk melihat bentuk kasih sayang yang paling rendah terasa buatmu.`;
  }

  return `${lowestCard.label} cenderung bukan sinyal utama yang paling cepat membuatmu merasa dicintai. Bukan berarti tidak penting, tetapi dampaknya biasanya tidak sekuat ${primaryCard.label}.`;
}

export default function LoveLanguageMappingUI({
  initialVariant = "lite",
  fixedVariant = false,
}: {
  initialVariant?: LoveLanguageTestVariant;
  fixedVariant?: boolean;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [testVariant, setTestVariant] = useState<LoveLanguageTestVariant>(initialVariant);
  const [answersByVariant, setAnswersByVariant] = useState<AnswersByVariant>({ lite: {}, pro: {} });

  const variantMeta = loveLanguageVariantMeta[testVariant];
  const answers = answersByVariant[testVariant];

  const steps = useMemo(
    () =>
      [
        { id: "instructions", title: "Petunjuk", description: `Mode ${variantMeta.label} dan skala jawaban` },
        { id: "questions", title: `${variantMeta.questionCount} Soal`, description: `${variantMeta.purpose}` },
        { id: "results", title: "Hasil", description: "Primary, secondary, dan ranking love language" },
      ] as const,
    [variantMeta.label, variantMeta.purpose, variantMeta.questionCount],
  );

  const currentQuestions = useMemo(
    () => loveLanguageQuestions.filter((question) => question.tier === testVariant),
    [testVariant],
  );

  const answeredCount = Object.keys(answers).length;
  const maxScore = getMaxScore(testVariant);

  const scoreCards = useMemo(() => {
    return categoryOrder
      .map((category) => {
        const questions = currentQuestions.filter((question) => question.category === category);
        const total = questions.reduce((sum, question) => sum + (answers[question.id] ?? 0), 0);
        const answeredItems = questions.filter((question) => answers[question.id] !== undefined).length;

        return {
          category,
          label: loveLanguageCategoryLabels[category],
          total,
          maxScore,
          pct: Math.round((total / maxScore) * 100),
          level: getLevelLabel(total, testVariant),
          itemIds: questions.map((question) => question.id),
          answeredItems,
          maxItems: questions.length,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [answers, currentQuestions, maxScore, testVariant]);

  const primaryCard = scoreCards[0] ?? null;
  const secondaryCard = scoreCards[1] ?? null;
  const isBilingual =
    !!primaryCard && !!secondaryCard && Math.abs(primaryCard.total - secondaryCard.total) <= getTieThreshold(testVariant);

  const primaryProfile = primaryCard ? loveLanguageProfiles[primaryCard.category] : null;
  const secondaryProfile = secondaryCard ? loveLanguageProfiles[secondaryCard.category] : null;

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
      <div className="card-primary p-5 md:p-8">
        <StepHeader activeStep={activeStep} steps={steps} />

        {!fixedVariant && (
          <VariantSwitcher
            activeVariant={testVariant}
            onChange={setTestVariant}
            onResetStep={() => setActiveStep(0)}
          />
        )}

        <div className="mt-6 min-h-[500px]">
          {activeStep === 0 && <InstructionPanel testVariant={testVariant} />}
          {activeStep === 1 && (
            <QuestionsPanel
              answers={answers}
              questions={currentQuestions}
              testVariant={testVariant}
              onPick={(questionId, value) =>
                setAnswersByVariant((prev) => ({
                  ...prev,
                  [testVariant]: {
                    ...prev[testVariant],
                    [questionId]: value,
                  },
                }))
              }
            />
          )}
          {activeStep === 2 && (
            <ResultPanel
              answeredCount={answeredCount}
              totalQuestionCount={currentQuestions.length}
              testVariant={testVariant}
              primaryCard={primaryCard}
              secondaryCard={secondaryCard}
              primaryProfile={primaryProfile}
              secondaryProfile={secondaryProfile}
              isBilingual={isBilingual}
              scoreCards={scoreCards}
            />
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-primary/20 pt-5">
          <button
            type="button"
            onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
            disabled={isFirstStep}
            className="btn btn-secondary-stroke inline-flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            Sebelumnya
          </button>

          <button
            type="button"
            onClick={() => setActiveStep((prev) => (isLastStep ? 0 : prev + 1))}
            className="btn btn-primary-solid inline-flex items-center gap-2"
          >
            {isLastStep ? "Ulang dari awal" : "Lanjut"}
            {!isLastStep && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </section>
  );
}

function StepHeader({
  activeStep,
  steps,
}: {
  activeStep: number;
  steps: readonly { id: string; title: string; description: string }[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-primary/20 p-2 text-primary">
            <HeartHandshake size={18} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Love Language Mapping</p>
            <h1 className="text-2xl font-black text-[#434343] md:text-3xl">Tes Refleksi Love Language</h1>
          </div>
        </div>

        <Link href="/" className="btn btn-secondary-stroke inline-flex items-center gap-2">
          <ArrowLeft size={14} />
          Main Menu
        </Link>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isComplete = index < activeStep;

          return (
            <div
              key={step.id}
              className={`rounded-2xl border px-3 py-3 transition ${
                isActive
                  ? "border-primary bg-primary/10"
                  : isComplete
                    ? "border-primary/50 bg-[#fff8fc]"
                    : "border-primary/20 bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                    isActive || isComplete ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isComplete ? <Check size={12} /> : index + 1}
                </div>
                <p className="text-xs font-black uppercase tracking-wider text-[#4b4b4b]">{step.title}</p>
              </div>
              <p className="mt-1 text-[11px] text-[#666]">{step.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VariantSwitcher({
  activeVariant,
  onChange,
  onResetStep,
}: {
  activeVariant: LoveLanguageTestVariant;
  onChange: (variant: LoveLanguageTestVariant) => void;
  onResetStep: () => void;
}) {
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-2">
      {(Object.keys(loveLanguageVariantMeta) as LoveLanguageTestVariant[]).map((variant) => {
        const meta = loveLanguageVariantMeta[variant];
        const isActive = variant === activeVariant;

        return (
          <button
            key={variant}
            type="button"
            onClick={() => {
              onChange(variant);
              onResetStep();
            }}
            className={`rounded-[1.75rem] border p-4 text-left transition ${
              isActive
                ? "border-primary bg-[#fff7fb] shadow-sm"
                : "border-primary/15 bg-white hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#444]">
                  {meta.label} Test
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-primary">
                    {meta.badge}
                  </span>
                </p>
                <p className="mt-1 text-xs font-bold text-[#666]">{meta.purpose}</p>
              </div>
              <span className="text-sm font-black text-primary">{meta.questionCount} soal</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#666]">{meta.description}</p>
          </button>
        );
      })}
    </div>
  );
}

function InstructionPanel({ testVariant }: { testVariant: LoveLanguageTestVariant }) {
  const meta = loveLanguageVariantMeta[testVariant];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary/30 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Posisi Instrumen</p>
        <p className="mt-2 text-sm leading-relaxed text-[#555]">
          Instrumen ini dibuat untuk kebutuhan aplikasi dan refleksi relasi, bukan alat diagnosis klinis. Hasilnya
          berguna untuk membaca bagaimana kamu paling sering merasa dicintai.
        </p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Mode Aktif</p>
        <p className="mt-2 text-sm text-[#555]">
          <span className="font-black text-primary">{meta.label}</span>: {meta.purpose}. Total {meta.questionCount}{" "}
          soal yang membaca lima bahasa cinta utama.
        </p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Skala Jawaban</p>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          {scaleOptions.map((option) => (
            <div key={option.code} className="rounded-xl border border-primary/20 bg-[#fff9fc] p-3">
              <p className="text-sm font-black text-primary">
                {option.code} = {option.value}
              </p>
              <p className="mt-1 text-xs text-[#666]">{option.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 text-amber-600" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Catatan Penting</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800">
              Banyak orang tidak hanya punya satu love language. Sangat mungkin kamu punya dua atau tiga yang dominan
              sekaligus, jadi lihat hasil sebagai profil, bukan cap tunggal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionsPanel({
  answers,
  questions,
  testVariant,
  onPick,
}: {
  answers: AnswerMap;
  questions: (typeof loveLanguageQuestions)[number][];
  testVariant: LoveLanguageTestVariant;
  onPick: (questionId: number, value: number) => void;
}) {
  const meta = loveLanguageVariantMeta[testVariant];

  return (
    <div className="space-y-6">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
        Mode {meta.label}: {meta.questionCount} soal
      </p>

      <div className="sticky top-24 z-30 rounded-2xl border border-primary/30 bg-white/95 p-2.5 shadow-md backdrop-blur sm:p-3">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">Panduan Jawaban Cepat</p>
        <div className="mt-2 flex flex-wrap gap-1 sm:hidden">
          {scaleOptions.map((option) => (
            <span
              key={`guide-mobile-${option.code}`}
              className="rounded-full border border-primary/20 bg-[#fff9fc] px-2 py-1 text-[11px] font-black text-primary"
            >
              {option.code}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[#666] sm:hidden">
          1 sangat tidak setuju, 5 sangat setuju.
        </p>
        <div className="mt-2 hidden gap-2 sm:grid sm:grid-cols-5">
          {scaleOptions.map((option) => (
            <div key={`guide-${option.code}`} className="rounded-xl border border-primary/20 bg-[#fff9fc] px-2 py-2">
              <p className="text-xs font-black text-primary">{option.code}</p>
              <p className="text-[11px] text-[#666]">{option.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <div key={`${testVariant}-${question.id}`} className="rounded-2xl border border-primary/15 bg-white p-4">
            <p className="text-sm font-semibold leading-relaxed text-[#4a4a4a]">
              {question.id}. {question.statement}
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5">
              {scaleOptions.map((option) => {
                const isSelected = answers[question.id] === option.value;

                return (
                  <button
                    key={`${testVariant}-${question.id}-${option.code}`}
                    type="button"
                    onClick={() => onPick(question.id, option.value)}
                    className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-primary/25 bg-white text-[#666] hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {option.code}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({
  answeredCount,
  totalQuestionCount,
  testVariant,
  primaryCard,
  secondaryCard,
  primaryProfile,
  secondaryProfile,
  isBilingual,
  scoreCards,
}: {
  answeredCount: number;
  totalQuestionCount: number;
  testVariant: LoveLanguageTestVariant;
  primaryCard: LoveLanguageScoreCard | null;
  secondaryCard: LoveLanguageScoreCard | null;
  primaryProfile: (typeof loveLanguageProfiles)[LoveLanguageCategory] | null;
  secondaryProfile: (typeof loveLanguageProfiles)[LoveLanguageCategory] | null;
  isBilingual: boolean;
  scoreCards: LoveLanguageScoreCard[];
}) {
  const meta = loveLanguageVariantMeta[testVariant];
  const lowestCard = scoreCards[scoreCards.length - 1] ?? null;
  const profileType = getProfileType(scoreCards);
  const gapInsight = getGapInsight(scoreCards);
  const hasPartialAnswers = answeredCount > 0 && answeredCount < totalQuestionCount;
  const positiveTriggers = dedupeItems([
    ...(primaryProfile?.appreciatedWhen ?? []),
    ...(secondaryProfile?.appreciatedWhen ?? []),
  ]).slice(0, 3);
  const negativeTriggers = dedupeItems([
    ...(primaryProfile?.watchOuts ?? []),
    ...(secondaryProfile?.watchOuts ?? []),
  ]).slice(0, 3);
  const partnerActions = dedupeItems([
    ...(primaryProfile?.partnerActions ?? []),
    ...(secondaryProfile?.partnerActions ?? []),
  ]).slice(0, 3);
  const userShowsLove = dedupeItems([
    ...(primaryProfile?.userShowsLove ?? []),
    ...(secondaryProfile?.userShowsLove ?? []),
  ]).slice(0, 3);
  const communicationTips = dedupeItems([
    ...(primaryProfile ? [primaryProfile.communicationTip] : []),
    ...(secondaryProfile ? [secondaryProfile.communicationTip] : []),
  ]).slice(0, 2);
  const blindSpotText = primaryCard ? buildBlindSpotText(primaryCard, lowestCard, isBilingual) : "";
  const missCommunicationText = primaryCard
    ? buildMissCommunicationText(primaryCard, secondaryCard, lowestCard)
    : "";
  const leastFeltSummary = primaryCard ? buildLeastFeltSummary(primaryCard, lowestCard) : "";
  const resultLead =
    primaryCard && secondaryCard
      ? isBilingual
        ? `Kamu punya dua bahasa kasih yang sama-sama kuat: ${primaryCard.label} dan ${secondaryCard.label}. Dua-duanya berpengaruh besar terhadap rasa aman dan rasa dihargai dalam hubungan.`
        : `Kamu paling sering merasa dicintai lewat ${primaryCard.label}, dengan ${secondaryCard.label} sebagai kebutuhan kedua yang juga cukup kuat.`
      : primaryCard
        ? `Kamu paling sering merasa dicintai lewat ${primaryCard.label}.`
        : "";
  const barStyles = ["bg-primary", "bg-primary/85", "bg-primary/70", "bg-primary/55", "bg-primary/40"];

  return (
    <div className="space-y-5">
      {answeredCount > 0 && primaryCard && primaryProfile ? (
        <>
          <div className="rounded-[2rem] border border-primary/25 bg-gradient-to-br from-[#fff7fb] via-white to-[#fff2f8] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Love Language Utama</p>
                <h2 className="mt-1 text-3xl font-black text-[#434343]">{primaryCard.label}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-primary/15 bg-white px-3 py-1 text-[11px] font-black text-primary">
                  Mode {meta.label}
                </span>
                <span className="rounded-full border border-primary/15 bg-white px-3 py-1 text-[11px] font-black text-primary">
                  Terjawab {answeredCount}/{totalQuestionCount}
                </span>
                {hasPartialAnswers && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
                    Hasil sementara
                  </span>
                )}
                {isBilingual && (
                  <span className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-[11px] font-black text-primary">
                    Dua bahasa dominan
                  </span>
                )}
              </div>
            </div>

            <p className="mt-4 text-base font-bold leading-relaxed text-[#4f4f4f]">{resultLead}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#666]">{primaryProfile.shortDescription}</p>
            {secondaryProfile && (
              <p className="mt-3 text-sm leading-relaxed text-[#666]">
                Secondary insight: {secondaryProfile.shortDescription}
              </p>
            )}
            {hasPartialAnswers && (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
                Karena belum semua soal terjawab, ranking dan insight di bawah ini masih bisa berubah setelah semua
                jawaban diisi.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-primary/20 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Secondary Love Language</p>
              <p className="mt-3 text-lg font-black text-[#444]">{secondaryCard?.label ?? "-"}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#666]">
                {secondaryCard
                  ? `${secondaryCard.label} juga cukup berpengaruh dalam membuatmu merasa dihargai.`
                  : "Belum ada cukup data untuk membaca bahasa kasih kedua."}
              </p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Tipe Profil</p>
              <p className="mt-3 text-lg font-black text-[#444]">{profileType.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#666]">{profileType.description}</p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Gap Antar Language</p>
              <p className="mt-3 text-lg font-black text-[#444]">
                {gapInsight.gap}% <span className="text-sm text-[#777]">{gapInsight.label}</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#666]">{gapInsight.description}</p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Yang Paling Kurang Terasa</p>
              <p className="mt-3 text-lg font-black text-[#444]">{lowestCard?.label ?? "-"}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#666]">{leastFeltSummary}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Grafik Skor 5 Love Language</p>
            <div className="mt-4 space-y-4">
              {scoreCards.map((card, index) => (
                <div key={`graph-${card.category}`} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[#444]">
                        {index + 1}. {card.label}
                      </p>
                      <p className="mt-1 text-xs text-[#777]">
                        Skor {card.total}/{card.maxScore} | {card.level}
                      </p>
                    </div>
                    <span className="text-lg font-black text-primary">{card.pct}%</span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-[#f7e6ef]">
                    <div
                      className={`h-full rounded-full ${barStyles[index] ?? "bg-primary/40"}`}
                      style={{ width: `${Math.max(card.pct, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Ranking Love Language Kamu</p>
            <div className="mt-4 space-y-3">
              {scoreCards.map((card, index) => (
                <div key={`ranking-new-${card.category}`} className="rounded-2xl border border-primary/15 bg-[#fffdfd] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-black text-[#444]">{card.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[#777]">
                          {index === 0
                            ? "Paling dominan dan paling cepat terasa secara emosional."
                            : index === 1
                              ? "Masih cukup kuat dan sering ikut menentukan rasa dekat."
                              : index === scoreCards.length - 1
                                ? "Biasanya bukan sinyal utama yang paling kamu cari."
                                : "Tetap bermakna, tapi tidak sekuat dua posisi teratas."}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-primary">{card.pct}%</p>
                      <p className="text-xs text-[#777]">
                        {card.total}/{card.maxScore} | {card.level}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden rounded-2xl border border-primary/20 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Ranking Love Language Kamu</p>
            <div className="mt-4 space-y-3">
              {scoreCards.map((card, index) => (
                <div key={card.category} className="rounded-2xl border border-primary/15 bg-[#fffdfd] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[#444]">
                        {index + 1}. {card.label}
                      </p>
                      <p className="mt-1 text-xs text-[#777]">
                        Skor {card.total}/{card.maxScore} • {card.level}
                      </p>
                    </div>
                    <span className="text-xl font-black text-primary">{card.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-primary/20 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Ciri-Ciri Umum</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#555]">
                {primaryProfile.signs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                Cara Kamu Paling Merasa Dicintai
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#555]">
                {primaryProfile.appreciatedWhen.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Yang Perlu Diperhatikan</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
                {primaryProfile.watchOuts.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-primary/20 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Trigger Positif</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#555]">
                {positiveTriggers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Trigger Negatif</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
                {negativeTriggers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                Cara Kamu Biasanya Menunjukkan Kasih Sayang
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#555]">
                {userShowsLove.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Blind Spot Dalam Hubungan</p>
              <p className="mt-3 text-sm leading-relaxed text-[#555]">{blindSpotText}</p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                Potensi Miss-Communication
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#555]">{missCommunicationText}</p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                Saran Komunikasi ke Pasangan
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#555]">
                {communicationTips.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50/60 p-5 md:col-span-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                3 Tindakan Kecil untuk Pasangan
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-green-900">
                {partnerActions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-primary/20 bg-white p-5">
          <p className="text-sm text-[#565656]">
            Belum ada jawaban. Silakan isi pertanyaan terlebih dahulu untuk melihat hasil love language.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Warning</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-900">
              Hasil ini bisa berubah tergantung konteks hubungan, pengalaman, dan cara kamu menafsirkan pertanyaan.
              Gunakan sebagai bahan refleksi, bukan label tunggal yang mutlak.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
