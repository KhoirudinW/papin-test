"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, ChevronLeft, ChevronRight, HeartHandshake, Share2, Sparkles, AlertCircle, Info, UserPlus, Database } from "lucide-react";
import ShareResultCard, { type ShareCardData } from "@/components/ShareResultCard";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getAuthHeader } from "@/lib/clientAuth";
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
  resultId,
}: {
  initialVariant?: LoveLanguageTestVariant;
  fixedVariant?: boolean;
  resultId?: string;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [testVariant, setTestVariant] = useState<LoveLanguageTestVariant>(initialVariant);
  const [answersByVariant, setAnswersByVariant] = useState<AnswersByVariant>({ lite: {}, pro: {} });
  const [showShareCard, setShowShareCard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useAuthSession();
  const hasSynced = useRef(false);

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

  const answeredCount = Object.keys(answers || {}).length;
  const maxScore = getMaxScore(testVariant);
  const totalQuestionCount = currentQuestions.length;
  const isResultsStep = activeStep === 2;

  const scoreCards = useMemo(() => {
    const safeAnswers = answers || {};
    return categoryOrder
      .map((category) => {
        const questions = currentQuestions.filter((question) => question.category === category);
        const total = questions.reduce((sum, question) => sum + (safeAnswers[question.id] ?? 0), 0);
        const answeredItems = questions.filter((question) => safeAnswers[question.id] !== undefined).length;

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

  // ── Persistence: Load results on mount ──────────────────────────
  // ── Persistence: Load results on mount ──────────────────────────
  useEffect(() => {
    // If we have a resultId, don't auto-restore from localStorage
    if (resultId) return;

    const storageKey = `papin_res_ll_v2`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.answersByVariant && typeof parsed.answersByVariant === 'object') {
          const loaded = parsed.answersByVariant;
          setAnswersByVariant({
            lite: loaded.lite && typeof loaded.lite === 'object' ? loaded.lite : {},
            pro: loaded.pro && typeof loaded.pro === 'object' ? loaded.pro : {},
          });

          // Jump to results if already finished
          const recoveredAnswers = loaded[testVariant] || {};
          const recoveredCount = Object.keys(recoveredAnswers).length;
          if (recoveredCount >= variantMeta.questionCount) {
             setActiveStep(2);
          }
        }
      } catch (e) {
        console.error("Failed to restore LL answers:", e);
      }
    }
  }, [testVariant, variantMeta.questionCount, resultId]);

  // ── Persistence: Save answers when they change ──────────────────
  useEffect(() => {
    // If viewing history, don't overwrite local storage
    if (resultId) return;

    if (Object.keys(answersByVariant.lite).length > 0 || Object.keys(answersByVariant.pro).length > 0) {
      const storageKey = `papin_res_ll_v2`;
      localStorage.setItem(storageKey, JSON.stringify({ answersByVariant, updatedAt: Date.now() }));
    }
  }, [answersByVariant, resultId]);

  // Reset flag sync tiap ganti variant
  useEffect(() => {
    hasSynced.current = false;
  }, [testVariant]);

  const primaryCard = scoreCards[0] ?? null;
  const secondaryCard = scoreCards[1] ?? null;
  const isBilingual =
    !!primaryCard && !!secondaryCard && Math.abs(primaryCard.total - secondaryCard.total) <= getTieThreshold(testVariant);

  const primaryProfile = primaryCard ? loveLanguageProfiles[primaryCard.category] : null;
  const secondaryProfile = secondaryCard ? loveLanguageProfiles[secondaryCard.category] : null;

  const profileType = getProfileType(scoreCards);
  const gapInsight = getGapInsight(scoreCards);

  const positiveTriggers = dedupeItems([
    ...(primaryProfile?.appreciatedWhen ?? []),
    ...(secondaryProfile?.appreciatedWhen ?? []),
  ]).slice(0, 3);

  // ── Sync to Database on Completion ─────────────────────────────
  useEffect(() => {
    const syncResult = async () => {
      if (resultId) return;                    // Sedang buka history, jangan simpan
      if (hasSynced.current) return;           // Sudah pernah disimpan untuk sesi ini
      if (activeStep !== 2) return;            // Belum di halaman hasil
      if (!isLoggedIn) return;                 // Belum login
      const currentAnswers = answersByVariant[testVariant];
      if (Object.keys(currentAnswers || {}).length < variantMeta.questionCount) return; // Belum selesai

      hasSynced.current = true; // Pasang flag SEBELUM async agar tidak double-fire
      setIsSaving(true);
      try {
        const authHeaders = await getAuthHeader();
        await fetch("/api/tests/results", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            test_slug: `love-language-${testVariant}`,
            variant: testVariant,
            score_data: {
              primary: primaryCard?.category,
              secondary: secondaryCard?.category,
              isBilingual,
              scores: scoreCards.map(c => ({ category: c.category, total: c.total, pct: c.pct }))
            },
            answers: currentAnswers
          }),
        });
      } catch (e) {
        hasSynced.current = false; // Reset agar bisa retry jika gagal
        console.error("Failed to sync Love Language result to DB:", e);
      } finally {
        setIsSaving(false);
      }
    };

    void syncResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, isLoggedIn, testVariant]);

  // ── Load Historical Result ─────────────────────────────────────
  useEffect(() => {
    const loadHistory = async () => {
      if (!resultId) return;
      
      setIsHistoryLoading(true);
      try {
        const authHeaders = await getAuthHeader();
        const response = await fetch("/api/tests/results", { headers: authHeaders }); // We use the same GET for simplicity, client filters
        if (!response.ok) throw new Error();
        const data = await response.json();
        const result = (data.results || []).find((r: any) => r.id === resultId);
        
        if (result) {
          if (result.variant) {
            setTestVariant(result.variant);
          }
          if (result.answers) {
            setAnswersByVariant((prev) => ({
              ...prev,
              [result.variant || "lite"]: result.answers
            }));
          }
          setActiveStep(2); // Direct to results
        }
      } catch (e) {
        console.error("Failed to load historical result:", e);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    
    void loadHistory();
  }, [resultId]);

  const shareCardData: ShareCardData | null = primaryCard && isResultsStep ? {
    testName: "Love Language Mapping",
    variant: variantMeta.label as "Lite" | "Pro",
    primaryLabel: primaryCard.label,
    secondaryLabel: secondaryCard && !isBilingual && secondaryCard.pct >= 65 ? secondaryCard.label : undefined,
    isBilingual,
    profileType: profileType.label,
    profileDescription: profileType.description,
    signs: primaryProfile?.signs ?? [],
    positiveTriggers: positiveTriggers,
    gapLabel: gapInsight.label,
    gapPct: gapInsight.gap
  } : null;

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  const handleNext = () => {
    setActiveStep((prev) => (isLastStep ? 0 : prev + 1));
  };

  const handleReset = () => {
    if (confirm("Hapus hasil tes ini dan mengulang dari awal?")) {
      const storageKey = `papin_res_ll_v2`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          delete parsed.answersByVariant[testVariant];
          localStorage.setItem(storageKey, JSON.stringify(parsed));
        } catch (e) {}
      }
      setAnswersByVariant((prev) => ({ ...prev, [testVariant]: {} }));
      setActiveStep(0);
    }
  };

  if (isHistoryLoading) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="card-primary flex flex-col items-center justify-center p-24 text-[#888]">
          <Database className="animate-pulse mb-4 text-primary" size={48} />
          <h2 className="text-xl font-black text-[#444]">Memuat Hasilmu...</h2>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#bbb]">Syncing with database</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 md:px-8">
      <div className="card-primary p-5 md:p-8">
        <div className="flex justify-between items-start">
           <StepHeader activeStep={activeStep} steps={steps} />
        </div>

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
          {isResultsStep && (
            <ResultPanel
              answeredCount={answeredCount}
              totalQuestionCount={totalQuestionCount}
              testVariant={testVariant}
              primaryCard={primaryCard}
              secondaryCard={secondaryCard}
              primaryProfile={primaryProfile}
              secondaryProfile={secondaryProfile}
              isBilingual={isBilingual}
              scoreCards={scoreCards}
              profileType={profileType}
              gapInsight={gapInsight}
              positiveTriggers={positiveTriggers}
              setShowShareCard={setShowShareCard}
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

          <div className="flex items-center gap-2">
            {isResultsStep ? (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-secondary-stroke inline-flex items-center gap-2"
                >
                  Reset
                </button>
                {!isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => router.push(`/register?next=${encodeURIComponent(pathname)}`)}
                    className="btn btn-secondary-stroke inline-flex items-center gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                  >
                    <UserPlus size={16} />
                    Daftar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowShareCard(true)}
                  className="btn btn-primary-solid inline-flex items-center gap-2"
                >
                  <Share2 size={16} />
                  Share ke IG
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary-solid inline-flex items-center gap-2"
              >
                Lanjut
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      {showShareCard && shareCardData && (
        <ShareResultCard data={shareCardData} onClose={() => setShowShareCard(false)} />
      )}
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
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black transition-all ${
                activeStep === idx
                  ? "bg-primary text-white scale-110 shadow-sm"
                  : activeStep > idx
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {activeStep > idx ? <Check size={12} /> : idx + 1}
            </div>
            {idx < steps.length - 1 && <div className="h-0.5 w-4 bg-gray-100" />}
          </div>
        ))}
      </div>
      <div className="mt-2">
        <h3 className="text-xl font-black text-[#444]">{steps[activeStep].title}</h3>
        <p className="text-xs font-bold text-[#888]">{steps[activeStep].description}</p>
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
  onChange: (v: LoveLanguageTestVariant) => void;
  onResetStep: () => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-gray-50 p-1.5 border border-gray-100">
      {(["lite", "pro"] as const).map((v) => (
        <button
          key={v}
          onClick={() => {
            onChange(v);
            onResetStep();
          }}
          className={`flex-1 rounded-xl px-4 py-2 text-xs font-black transition-all active:scale-95 touch-manipulation select-none ${
            activeVariant === v ? "bg-white text-primary shadow-sm ring-1 ring-primary/20" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          {loveLanguageVariantMeta[v].label}
        </button>
      ))}
    </div>
  );
}

function InstructionPanel({ testVariant }: { testVariant: LoveLanguageTestVariant }) {
  const meta = loveLanguageVariantMeta[testVariant];
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 rounded-2xl bg-linear-to-br from-primary/5 to-secondary/5 p-6 border border-primary/10">
        <h4 className="flex items-center gap-2 text-lg font-black text-primary">
          <HeartHandshake size={20} />
          Tentang Test {meta.label}
        </h4>
        <p className="mt-3 text-sm leading-relaxed text-[#555]">
          {meta.purpose} Test ini menggunakan skala 1-10 untuk menilai seberapa penting suatu perilaku pasangan bagimu.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
           <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold">
              <Info size={16} />
              <span className="text-sm">Skala Jawaban</span>
           </div>
           <p className="text-xs text-blue-900/70 leading-relaxed">
             Semakin tinggi skornya, semakin besar dampak positif gesture tersebut terhadap perasaan dicintaimu.
           </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
           <div className="flex items-center gap-2 mb-2 text-amber-700 font-bold">
              <AlertCircle size={16} />
              <span className="text-sm">Tips Mengisi</span>
           </div>
           <p className="text-xs text-amber-900/70 leading-relaxed">
             Klik angka yang paling mewakili perasaanmu secara alami, jangan terlalu lama berpikir ya!
           </p>
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
  questions: typeof loveLanguageQuestions;
  testVariant: LoveLanguageTestVariant;
  onPick: (id: number, val: number) => void;
}) {
  const safeAnswers = answers || {};
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {questions.map((q, idx) => (
        <div key={q.id} className="group">
          <div className="flex items-start gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
              {idx + 1}
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#444] leading-relaxed md:text-base">{q.statement}</p>
              <div className="mt-5 flex flex-wrap gap-2 md:gap-3">
                {scaleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onPick(q.id, opt.value)}
                    className={`flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl text-base font-black transition-all active:scale-90 touch-manipulation select-none ${
                      safeAnswers[q.id] === opt.value
                        ? "bg-primary text-white scale-110 shadow-lg ring-4 ring-primary/20"
                        : "bg-white text-gray-500 border-2 border-gray-100 hover:border-primary/30 hover:text-primary hover:bg-primary/5 shadow-sm"
                    }`}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex justify-between px-1 text-[10px] font-black uppercase tracking-widest text-[#bbb]">
                <span>Tidak Penting</span>
                <span>Sangat Penting</span>
              </div>
            </div>
          </div>
        </div>
      ))}
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
  profileType,
  gapInsight,
  positiveTriggers,
  setShowShareCard,
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
  profileType: ReturnType<typeof getProfileType>;
  gapInsight: ReturnType<typeof getGapInsight>;
  positiveTriggers: string[];
  setShowShareCard: (v: boolean) => void;
}) {
  const meta = loveLanguageVariantMeta[testVariant];
  const lowestCard = scoreCards[scoreCards.length - 1] ?? null;
  const hasPartialAnswers = answeredCount > 0 && answeredCount < totalQuestionCount;
  
  const communicationTips = dedupeItems([
    ...(primaryProfile ? [primaryProfile.communicationTip] : []),
    ...(secondaryProfile ? [secondaryProfile.communicationTip] : []),
  ]).slice(0, 2);

  const blindSpotText = primaryCard ? buildBlindSpotText(primaryCard, lowestCard, isBilingual) : "";
  const missCommunicationText = primaryCard
    ? buildMissCommunicationText(primaryCard, secondaryCard, lowestCard)
    : "";

  if (hasPartialAnswers) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-amber-50 p-4 text-amber-500">
          <AlertTriangle size={48} />
        </div>
        <h3 className="mt-4 text-xl font-black text-[#444]">Belum Selesai</h3>
        <p className="mt-2 max-w-sm text-sm text-[#888]">
          Kamu baru menjawab {answeredCount} dari {totalQuestionCount} soal. Selesaikan semua soal untuk melihat hasil
          analisis yang akurat.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-1000">
       <div className="mb-8 rounded-3xl bg-linear-to-br from-primary/20 via-blue-200/10 to-secondary/20 p-6 border border-white/40 shadow-xl backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
            <Sparkles size={40} className="text-secondary" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#fa83ae] mb-1">Spread the Love</p>
              <h3 className="text-xl md:text-2xl font-black text-[#535252]">Hasilmu Iconic Banget! ✨</h3>
              <p className="mt-1 text-sm font-medium text-[#7a7a7a]">Bagikan insight ini ke Instagram Story atau feed-mu.</p>
            </div>
            <button
               onClick={() => setShowShareCard(true)}
               className="btn bg-white text-primary border-2 border-primary/20 hover:border-primary px-8 py-3 rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-primary/20 transition-all font-black"
            >
              <Share2 size={18} />
              Share ke IG
            </button>
          </div>
        </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Primary Result</p>
            <h4 className="text-3xl font-black text-[#3d3d3d] leading-tight">
              {isBilingual ? "Dua Bahasa Dominan" : primaryCard?.label}
            </h4>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-1.5 text-xs font-black text-primary">
               <Sparkles size={14} />
               {profileType.label}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#666]">{profileType.description}</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
             <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Ranking Bahasa Kasih</p>
             <div className="space-y-4">
                {scoreCards.map((card, idx) => (
                  <div key={card.category} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-[#555]">
                      <span>{card.label}</span>
                      <span>{card.pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full transition-all duration-1000 ${
                           idx === 0 ? "bg-primary" : idx === 1 ? "bg-primary/80" : "bg-primary/60"
                        }`}
                        style={{ width: `${card.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="rounded-3xl bg-primary/5 p-6 border border-primary/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Insight & Reflection</p>
          
          <div className="space-y-6">
             <div>
                <h5 className="text-sm font-black text-[#444] mb-2 flex items-center gap-2">
                   <AlertCircle size={15} className="text-primary" />
                   Potential Blind Spot
                </h5>
                <p className="text-xs leading-relaxed text-[#666]">{blindSpotText}</p>
             </div>
             <div>
                <h5 className="text-sm font-black text-[#444] mb-2 flex items-center gap-2">
                   <Info size={15} className="text-primary" />
                   The Gap Insight
                </h5>
                <p className="text-xs leading-relaxed text-[#666]">{gapInsight.description}</p>
             </div>
             <div>
                <h5 className="text-sm font-black text-[#444] mb-2 flex items-center gap-2">
                   <AlertTriangle size={15} className="text-primary" />
                   Miscommunication Risk
                </h5>
                <p className="text-xs leading-relaxed text-[#666]">{missCommunicationText}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
