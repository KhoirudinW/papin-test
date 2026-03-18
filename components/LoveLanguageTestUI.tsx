"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Share2,
  Info,
  AlertCircle,
  UserPlus,
  Database,
} from "lucide-react";
import ShareResultCard, { type ShareCardData } from "@/components/ShareResultCard";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getAuthHeader } from "@/lib/clientAuth";
import {
  attachmentVariantMeta,
  attachmentQuestions,
  attachmentStyleSummaries,
  attachmentDimensionDescriptions,
  scaleOptions,
  type AttachmentStyle,
  type AttachmentTestVariant,
  type AttachmentDimension,
} from "@/data/attachmentQuestions";

type AnswerMap = Record<number, number>;
type AnswersByVariant = Record<AttachmentTestVariant, AnswerMap>;

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

export default function AttachmentReflectionUI({
  initialVariant = "lite",
  fixedVariant = false,
  resultId,
}: {
  initialVariant?: AttachmentTestVariant;
  fixedVariant?: boolean;
  resultId?: string;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [testVariant, setTestVariant] = useState<AttachmentTestVariant>(initialVariant);
  const [answersByVariant, setAnswersByVariant] = useState<AnswersByVariant>({ lite: {}, pro: {} });
  const [showShareCard, setShowShareCard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useAuthSession();
  // Flag: cegah save lebih dari sekali per sesi tes
  const hasSynced = useRef(false);

  const variantMeta = attachmentVariantMeta[testVariant];
  const answers = answersByVariant[testVariant];

  const steps = useMemo(
    () =>
      [
        { id: "instructions", title: "Petunjuk", description: `Mode ${variantMeta.label} dan refleksi diri` },
        { id: "questions", title: `${variantMeta.questionCount} Soal`, description: `${variantMeta.purpose}` },
        { id: "results", title: "Hasil", description: "Analisis gaya kelekatan (Attachment Style)" },
      ] as const,
    [variantMeta.label, variantMeta.purpose, variantMeta.questionCount],
  );

  const currentQuestions = useMemo(
    () => attachmentQuestions.filter((q) => q.tier === testVariant),
    [testVariant],
  );

  const answeredCount = Object.keys(answers || {}).length;
  const isResultsStep = activeStep === 2;

  const scoreCards = useMemo(() => {
    const safeAnswers = answers || {};
    return (["anxiety", "avoidance"] as const).map((dim) => {
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
      };
    });
  }, [answers, currentQuestions]);

  const attachmentStyle = calculateStyle(scoreCards);
  const styleResult = attachmentStyleSummaries[attachmentStyle]
    ? { ...attachmentStyleSummaries[attachmentStyle], style: attachmentStyle }
    : null;

  // ── Persistence: Load results on mount ──────────────────────────
  useEffect(() => {
    // If we have a resultId, don't auto-restore from localStorage
    if (resultId) return;

    const storageKey = `papin_res_att_v2`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.answersByVariant && typeof parsed.answersByVariant === 'object') {
          const loaded = parsed.answersByVariant;
          // Ensure both variants exist with valid objects
          setAnswersByVariant({
            lite: loaded.lite && typeof loaded.lite === 'object' ? loaded.lite : {},
            pro: loaded.pro && typeof loaded.pro === 'object' ? loaded.pro : {},
          });

          const recoveredAnswers = loaded[testVariant] || {};
          const recoveredCount = Object.keys(recoveredAnswers).length;
          if (recoveredCount >= variantMeta.questionCount) {
             setActiveStep(2);
          }
        }
      } catch (e) {
        console.error("Failed to restore Attachment answers:", e);
      }
    }
  }, [testVariant, variantMeta.questionCount]);

  // ── Persistence: Save answers when they change ──────────────────
  useEffect(() => {
    if (Object.keys(answersByVariant.lite).length > 0 || Object.keys(answersByVariant.pro).length > 0) {
      const storageKey = `papin_res_att_v2`;
      localStorage.setItem(storageKey, JSON.stringify({ answersByVariant, updatedAt: Date.now() }));
    }
  }, [answersByVariant]);

  // Reset flag sync tiap ganti variant
  useEffect(() => {
    hasSynced.current = false;
  }, [testVariant]);

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
            test_slug: `attachment-${testVariant}`,
            variant: testVariant,
            score_data: {
              style: styleResult?.style,
              label: styleResult?.label,
              scores: scoreCards.map(c => ({ dimension: c.dimension, avg: c.avg, level: c.level }))
            },
            answers: currentAnswers
          }),
        });
      } catch (e) {
        hasSynced.current = false; // Reset agar bisa retry jika gagal
        console.error("Failed to sync Attachment result to DB:", e);
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
        const response = await fetch("/api/tests/results", { headers: authHeaders });
        if (!response.ok) throw new Error();
        const data = await response.json();
        const result = (data.results || []).find((r: any) => r.id === resultId);
        
        if (result) {
          if (result.variant) {
            setTestVariant(result.variant as AttachmentTestVariant);
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

  const shareCardData: ShareCardData | null = styleResult && isResultsStep
    ? {
        testName: "Attachment Reflection",
        variant: testVariant === "lite" ? "Lite" : "Pro",
        primaryLabel: styleResult.label,
        profileType: styleResult.label,
        profileDescription: styleResult.shortDescription,
        tendencyText: styleResult.tendency,
        signs: styleResult.traits.slice(0, 3),
        positiveTriggers: styleResult.pros.slice(0, 3),
        positiveTriggerLabel: "Kelebihanmu",
      }
    : null;

  const handleReset = () => {
    if (confirm("Hapus hasil refleksi ini dan mengulang dari awal?")) {
      const storageKey = `papin_res_att_v2`;
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

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  const handleNext = () => {
    setActiveStep((prev) => (isLastStep ? 0 : prev + 1));
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
              onPick={(id, val) =>
                setAnswersByVariant((prev) => ({
                  ...prev,
                  [testVariant]: { ...prev[testVariant], [id]: val },
                }))
              }
            />
          )}
          {isResultsStep && (
            <ResultPanel
              answeredCount={answeredCount}
              testVariant={testVariant}
              scoreCards={scoreCards}
              styleResult={styleResult}
              totalQuestionCount={currentQuestions.length}
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
  activeVariant: AttachmentTestVariant;
  onChange: (v: AttachmentTestVariant) => void;
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
          {attachmentVariantMeta[v].label}
        </button>
      ))}
    </div>
  );
}

function InstructionPanel({ testVariant }: { testVariant: AttachmentTestVariant }) {
  const meta = attachmentVariantMeta[testVariant];
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 rounded-2xl bg-linear-to-br from-primary/5 to-secondary/5 p-6 border border-primary/10">
        <h4 className="flex items-center gap-2 text-lg font-black text-primary">
          <ClipboardCheck size={20} />
          Tentang Refleksi {meta.label}
        </h4>
        <p className="mt-3 text-sm leading-relaxed text-[#555]">
          {meta.purpose} Test ini menggunakan skala 1-5 untuk melihat kecenderunganmu dalam hubungan.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
           <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold">
              <Info size={16} />
              <span className="text-sm">Skala Jawaban</span>
           </div>
           <p className="text-xs text-blue-900/70 leading-relaxed">
             Skala 1 (Sangat Tidak Setuju) hingga 5 (Sangat Setuju).
           </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
           <div className="flex items-center gap-2 mb-2 text-amber-700 font-bold">
              <AlertCircle size={16} />
              <span className="text-sm">Kejujuran</span>
           </div>
           <p className="text-xs text-amber-900/70 leading-relaxed">
             Hasil paling akurat didapat dari jawaban yang paling jujur, bukan yang "terlihat baik".
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
  questions: typeof attachmentQuestions;
  testVariant: AttachmentTestVariant;
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultPanel({
  answeredCount,
  testVariant,
  scoreCards,
  styleResult,
  totalQuestionCount,
  setShowShareCard,
}: {
  answeredCount: number;
  testVariant: AttachmentTestVariant;
  scoreCards: ScoreCard[];
  styleResult: (typeof attachmentStyleSummaries)[AttachmentStyle] & { style: AttachmentStyle } | null;
  totalQuestionCount: number;
  setShowShareCard: (v: boolean) => void;
}) {
  const meta = attachmentVariantMeta[testVariant];

  return (
    <div className="space-y-5 animate-in fade-in duration-1000">
      {styleResult ? (
        <>
          <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-linear-to-r from-[#fff5fb] to-[#fff0f7] px-4 py-3 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Tesmu sudah selesai 🎉</p>
              <p className="mt-0.5 text-[11px] text-[#888]">Bagikan hasilmu ke Instagram!</p>
            </div>
            <button
              type="button"
              onClick={() => setShowShareCard(true)}
              className="btn btn-primary-solid inline-flex items-center gap-2 py-2! text-xs! shadow-md hover:shadow-primary/20 relative z-10"
            >
              <Share2 size={13} />
              Share ke IG
            </button>
          </div>
          <div className="rounded-4xl border border-primary/25 bg-linear-to-br from-[#fff7fb] via-white to-[#fff2f8] p-6 shadow-sm">
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
                  {attachmentDimensionDescriptions[card.dimension].map((item: string) => (
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
