"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, ChevronLeft, ChevronRight, HeartHandshake } from "lucide-react";
import {
  attachmentDimensionDescriptions,
  attachmentDimensionLabels,
  attachmentQuestions,
  attachmentStyleSummaries,
  attachmentVariantMeta,
  scaleOptions,
  type AttachmentDimension,
  type AttachmentStyle,
  type AttachmentTestVariant,
} from "@/data/attachmentQuestions";

type AnswerMap = Record<number, number>;
type AnswersByVariant = Record<AttachmentTestVariant, AnswerMap>;

const HIGH_THRESHOLD = 3.25;

function normalizeScore(value: number, reverse?: boolean): number {
  return reverse ? 6 - value : value;
}

function getLevelLabel(avg: number): string {
  if (avg < 2.5) {
    return "Rendah";
  }
  if (avg < 3.5) {
    return "Sedang";
  }
  return "Tinggi";
}

function getAttachmentStyle(anxietyAvg: number, avoidanceAvg: number): AttachmentStyle {
  const anxietyHigh = anxietyAvg >= HIGH_THRESHOLD;
  const avoidanceHigh = avoidanceAvg >= HIGH_THRESHOLD;

  if (anxietyHigh && avoidanceHigh) {
    return "fearful";
  }
  if (anxietyHigh) {
    return "anxious";
  }
  if (avoidanceHigh) {
    return "avoidant";
  }
  return "secure";
}

export default function AttachmentReflectionUI({
  initialVariant = "lite",
  fixedVariant = false,
}: {
  initialVariant?: AttachmentTestVariant;
  fixedVariant?: boolean;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [testVariant, setTestVariant] = useState<AttachmentTestVariant>(initialVariant);
  const [answersByVariant, setAnswersByVariant] = useState<AnswersByVariant>({ lite: {}, pro: {} });

  const variantMeta = attachmentVariantMeta[testVariant];
  const answers = answersByVariant[testVariant];

  const steps = useMemo(
    () =>
      [
        { id: "instructions", title: "Petunjuk", description: `Mode ${variantMeta.label} dan skala jawaban` },
        { id: "questions", title: `${variantMeta.questionCount} Soal`, description: `${variantMeta.purpose}` },
        { id: "results", title: "Hasil", description: "Highlight attachment style dan insight singkat" },
      ] as const,
    [variantMeta.label, variantMeta.purpose, variantMeta.questionCount],
  );

  const currentQuestions = useMemo(
    () => attachmentQuestions.filter((question) => question.tier === testVariant),
    [testVariant],
  );

  const answeredCount = Object.keys(answers).length;

  const scoringMap = useMemo(() => {
    return {
      anxiety: currentQuestions.filter((question) => question.dimension === "anxiety"),
      avoidance: currentQuestions.filter((question) => question.dimension === "avoidance"),
    } satisfies Record<AttachmentDimension, (typeof attachmentQuestions)[number][]>;
  }, [currentQuestions]);

  const scoreCards = useMemo(() => {
    return (Object.keys(scoringMap) as AttachmentDimension[]).map((dimension) => {
      const questions = scoringMap[dimension];
      const answeredItems = questions.filter((question) => answers[question.id] !== undefined);
      const normalizedTotal = answeredItems.reduce(
        (sum, question) => sum + normalizeScore(answers[question.id] ?? 0, question.reverse),
        0,
      );
      const itemCount = answeredItems.length;
      const avg = itemCount ? normalizedTotal / itemCount : 0;
      const pct = itemCount ? Math.round((normalizedTotal / (itemCount * 5)) * 100) : 0;

      return {
        dimension,
        label: attachmentDimensionLabels[dimension],
        total: normalizedTotal,
        answeredItems: itemCount,
        itemIds: questions.map((question) => question.id),
        avg,
        pct,
        level: getLevelLabel(avg),
      };
    });
  }, [answers, scoringMap]);

  const anxietyCard = scoreCards.find((card) => card.dimension === "anxiety") ?? null;
  const avoidanceCard = scoreCards.find((card) => card.dimension === "avoidance") ?? null;

  const styleResult = useMemo(() => {
    if (!anxietyCard || !avoidanceCard || answeredCount === 0) {
      return null;
    }

    const style = getAttachmentStyle(anxietyCard.avg, avoidanceCard.avg);
    return {
      style,
      ...attachmentStyleSummaries[style],
    };
  }, [anxietyCard, avoidanceCard, answeredCount]);

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
              testVariant={testVariant}
              scoreCards={scoreCards}
              styleResult={styleResult}
              totalQuestionCount={currentQuestions.length}
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
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Attachment Reflection</p>
            <h1 className="text-2xl font-black text-[#434343] md:text-3xl">
              Tes Refleksi Attachment Style
            </h1>
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
  activeVariant: AttachmentTestVariant;
  onChange: (variant: AttachmentTestVariant) => void;
  onResetStep: () => void;
}) {
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-2">
      {(Object.keys(attachmentVariantMeta) as AttachmentTestVariant[]).map((variant) => {
        const meta = attachmentVariantMeta[variant];
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

function InstructionPanel({ testVariant }: { testVariant: AttachmentTestVariant }) {
  const meta = attachmentVariantMeta[testVariant];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary/30 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Posisi Instrumen</p>
        <p className="mt-2 text-sm leading-relaxed text-[#555]">
          Instrumen ini dirancang agar kuat secara teori, tetapi belum tervalidasi secara akademik seperti alat
          penelitian formal. Jadi hasilnya dipakai untuk refleksi diri, bukan sebagai label final atau diagnosis.
        </p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Mode Aktif</p>
        <p className="mt-2 text-sm text-[#555]">
          <span className="font-black text-primary">{meta.label}</span>: {meta.purpose}. Total {meta.questionCount}{" "}
          soal dengan fokus pada dua dimensi utama, yaitu attachment anxiety dan attachment avoidance.
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
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
              Catatan Profesional Penting
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800">
              Hasil tidak langsung dimaksudkan sebagai cap seperti &quot;kamu avoidant&quot;. Bahasa hasil akan dibuat lebih
              halus, misalnya &quot;kamu cenderung menjaga kemandirian emosional dalam hubungan&quot;.
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
  questions: (typeof attachmentQuestions)[number][];
  testVariant: AttachmentTestVariant;
  onPick: (questionId: number, value: number) => void;
}) {
  const meta = attachmentVariantMeta[testVariant];

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
          1 paling tidak sesuai, 5 paling sesuai.
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
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold leading-relaxed text-[#4a4a4a]">
                {question.id}. {question.statement}
              </p>
              {question.reverse && (
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
                  Reverse
                </span>
              )}
            </div>

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

function ResultPanel({
  answeredCount,
  testVariant,
  scoreCards,
  styleResult,
  totalQuestionCount,
}: {
  answeredCount: number;
  testVariant: AttachmentTestVariant;
  scoreCards: ScoreCard[];
  styleResult: (typeof attachmentStyleSummaries)[AttachmentStyle] & { style: AttachmentStyle } | null;
  totalQuestionCount: number;
}) {
  const meta = attachmentVariantMeta[testVariant];

  return (
    <div className="space-y-5">
      {styleResult ? (
        <>
          <div className="rounded-[2rem] border border-primary/25 bg-gradient-to-br from-[#fff7fb] via-white to-[#fff2f8] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Hasil Attachment</p>
                <h2 className="mt-1 text-3xl font-black text-[#434343]">{styleResult.label}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-primary/15 bg-white px-3 py-1 text-[11px] font-black text-primary">
                  Mode {meta.label}
                </span>
                <span className="rounded-full border border-primary/15 bg-white px-3 py-1 text-[11px] font-black text-primary">
                  Terjawab {answeredCount}/{totalQuestionCount}
                </span>
              </div>
            </div>

            <p className="mt-4 text-base font-bold leading-relaxed text-[#4f4f4f]">{styleResult.tendency}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#666]">{styleResult.shortDescription}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-primary/20 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Ciri-Ciri Umum</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#555]">
                {styleResult.traits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Attachment yang Cocok</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#555]">
                {styleResult.compatibleWith.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50/60 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">Pros</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-green-900">
                {styleResult.pros.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Cons</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
                {styleResult.cons.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {scoreCards.map((card) => (
              <div key={card.dimension} className="rounded-2xl border border-primary/20 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-[#4d4d4d]">{card.label}</p>
                  <span className="rounded-full bg-primary/15 px-2 py-1 text-[11px] font-black text-primary">
                    {card.level}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#666]">
                  Rata-rata dimensi: {card.avg.toFixed(2)} dari 5
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#555]">
                  {attachmentDimensionDescriptions[card.dimension].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-primary/20 bg-white p-5">
          <p className="text-sm text-[#565656]">
            Belum ada jawaban. Silakan isi pertanyaan terlebih dahulu untuk melihat hasil refleksi attachment.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Warning</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-900">
              Hasil ini bisa saja kurang tepat atau tidak sepenuhnya menggambarkan dirimu. Gunakan sebagai bahan
              refleksi, bukan kesimpulan mutlak tentang siapa kamu atau hubunganmu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
