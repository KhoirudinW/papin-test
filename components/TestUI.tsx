"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  Share2,
  UserPlus,
  Lock,
  AlertTriangle,
  Info,
  AlertCircle,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import ShareResultCard from "@/components/ShareResultCard";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getAuthHeader } from "@/lib/clientAuth";
import type { TestConfig, StandardTestResult } from "@/types/testConfig";

export default function TestUI<TVariant extends string, TAnswers extends Record<number, number>>({
  config,
  initialVariant,
  fixedVariant = false,
  resultId,
}: {
  config: TestConfig<TVariant, TAnswers>;
  initialVariant: TVariant;
  fixedVariant?: boolean;
  resultId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useAuthSession();

  const [testVariant, setTestVariant] = useState<TVariant>(initialVariant);
  const [activeStep, setActiveStep] = useState(0);

  const [answersByVariant, setAnswersByVariant] = useState<Record<string, TAnswers>>(() => {
    const init: any = {};
    for (const v of config.variants) {
      init[v] = {};
    }
    return init;
  });

  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const hasSynced = useRef(false);

  const variantMeta = config.getVariantMeta(testVariant);
  const questions = config.getQuestions(testVariant);
  const scaleOptionsList = config.getScaleOptions(testVariant);

  const answers = (answersByVariant[testVariant as string] as TAnswers) || ({} as TAnswers);
  const answeredCount = Object.keys(answers).length;

  const steps = useMemo(
    () => [
      { id: "instructions", title: "Petunjuk", description: `Mode ${variantMeta.label}` },
      { id: "questions", title: `${variantMeta.questionCount} Soal`, description: `${variantMeta.purpose}` },
      { id: "results", title: "Hasil", description: "Analisis dan Insight" },
    ],
    [variantMeta]
  );

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === 2;

  // ── Persistence: Load results on mount ──────────────────────────
  useEffect(() => {
    if (resultId) return;

    const saved = localStorage.getItem(config.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.answersByVariant && typeof parsed.answersByVariant === "object") {
          const loaded = parsed.answersByVariant;
          setAnswersByVariant((prev) => {
            const next = { ...prev };
            for (const v of config.variants) {
              if (loaded[v] && typeof loaded[v] === "object") {
                next[v] = loaded[v];
              }
            }
            return next;
          });

          const recoveredAnswers = loaded[testVariant] || {};
          const recoveredCount = Object.keys(recoveredAnswers).length;
          if (recoveredCount >= variantMeta.questionCount) {
            setActiveStep(2);
          }
        }
      } catch (e) {
        console.error(`Failed to restore answers for ${config.testSlug}:`, e);
      }
    }
  }, [testVariant, variantMeta.questionCount, resultId, config]);

  // ── Persistence: Save answers when they change ──────────────────
  useEffect(() => {
    if (resultId) return;
    
    // Check if any variant has answers before saving
    let hasData = false;
    for (const v of config.variants) {
      if (Object.keys(answersByVariant[v as string]).length > 0) {
        hasData = true;
        break;
      }
    }

    if (hasData) {
      localStorage.setItem(config.storageKey, JSON.stringify({ answersByVariant, updatedAt: Date.now() }));
    }
  }, [answersByVariant, resultId, config]);

  // Reset flag sync tiap ganti variant
  useEffect(() => {
    hasSynced.current = false;
  }, [testVariant]);

  const resultData = useMemo(() => {
    if (activeStep !== 2) return null;
    return config.calculateResult(answers, testVariant);
  }, [activeStep, config, answers, testVariant]);

  // ── Sync to Database on Completion ─────────────────────────────
  useEffect(() => {
    const syncResult = async () => {
      if (resultId) return;
      if (hasSynced.current) return;
      if (activeStep !== 2) return;
      if (!isLoggedIn) return;
      if (answeredCount < variantMeta.questionCount) return;

      hasSynced.current = true;
      setIsSaving(true);
      try {
        const authHeaders = await getAuthHeader();
        const payload = config.getSyncPayload(resultData!, answers, testVariant);
        
        await fetch("/api/tests/results", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            ...payload,
            status: "completed",
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }),
        });
      } catch (e) {
        hasSynced.current = false;
        console.error(`Failed to sync result to DB for ${config.testSlug}:`, e);
      } finally {
        setIsSaving(false);
      }
    };

    void syncResult();
  }, [activeStep, isLoggedIn, testVariant, answeredCount, variantMeta.questionCount, resultId, config, answers, resultData]);

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
            setTestVariant(result.variant);
          }
          if (result.answers) {
            setAnswersByVariant((prev) => ({
              ...prev,
              [result.variant || config.variants[0]]: result.answers as TAnswers,
            }));
          }
          setActiveStep(2);
        }
      } catch (e) {
        console.error("Failed to load historical result:", e);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    void loadHistory();
  }, [resultId, config]);

  const shareCardData = useMemo(() => {
    if (!resultData || !showShareCard) return null;
    return config.getShareData(resultData, testVariant);
  }, [resultData, showShareCard, config, testVariant]);

  const handleReset = () => {
    toast("Mulai Ulang Tes?", {
      description: "Hapus hasil tes ini dan mengulang dari awal?",
      action: {
        label: "Hapus",
        onClick: () => {
          const saved = localStorage.getItem(config.storageKey);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              parsed.answersByVariant[testVariant as string] = {};
              localStorage.setItem(config.storageKey, JSON.stringify(parsed));
            } catch (e) {}
          }
          setAnswersByVariant((prev) => ({ ...prev, [testVariant as string]: {} as TAnswers }));
          setActiveStep(0);
          toast.success("Hasil tes telah dihapus.");
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      },
    });
  };

  const handleNext = () => {
    if (activeStep === 1 && answeredCount < variantMeta.questionCount) {
      toast.error(`Selesaikan semua ${variantMeta.questionCount} soal dulu ya, Kak! 😊`);
      return;
    }
    setActiveStep((prev) => (isLastStep ? 0 : prev + 1));
  };
  
  const handlePick = (questionId: number, value: number) => {
    setAnswersByVariant((prev) => ({
      ...prev,
      [testVariant as string]: {
        ...(prev[testVariant as string] || {}),
        [questionId]: value,
      } as TAnswers,
    }));
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
            variants={config.variants}
            getVariantMeta={config.getVariantMeta}
            activeVariant={testVariant}
            onChange={setTestVariant}
            onResetStep={() => setActiveStep(0)}
            isLoggedIn={isLoggedIn}
            onRequireLogin={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}
          />
        )}

        <div className="mt-6 min-h-[500px]">
          {activeStep === 0 && <InstructionPanel meta={variantMeta} />}
          {activeStep === 1 && (
            <QuestionsPanel
              answers={answers}
              questions={questions}
              scaleOptions={scaleOptionsList}
              onPick={handlePick}
            />
          )}
          {activeStep === 2 && resultData && (
            <ResultPanel
              result={resultData}
              answeredCount={answeredCount}
              totalQuestionCount={variantMeta.questionCount}
              setShowShareCard={setShowShareCard}
              isPro={testVariant === "pro"}
              router={router}
              pathname={pathname}
            />
          )}
        </div>

        <div className="mt-8 flex flex-wrap-reverse items-center justify-between gap-3 border-t border-primary/20 pt-5">
          <button
            type="button"
            onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
            disabled={isFirstStep}
            className="btn btn-secondary-stroke inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <ChevronLeft size={16} />
            Sebelumnya
          </button>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {isLastStep ? (
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
                className="btn btn-primary-solid inline-flex items-center gap-2 font-black shadow-md shadow-primary/20"
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

// ── SUBCOMPONENTS ──────────────────────────────────────────────────

function StepHeader({ activeStep, steps }: { activeStep: number; steps: any[] }) {
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

function VariantSwitcher<TVariant extends string>({
  variants,
  getVariantMeta,
  activeVariant,
  onChange,
  onResetStep,
  isLoggedIn,
  onRequireLogin,
}: {
  variants: TVariant[];
  getVariantMeta: (v: TVariant) => any;
  activeVariant: TVariant;
  onChange: (v: TVariant) => void;
  onResetStep: () => void;
  isLoggedIn: boolean;
  onRequireLogin: () => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-gray-50 p-1.5 border border-gray-100">
      {variants.map((v) => {
        const isPro = v === "pro";
        const isLocked = isPro && !isLoggedIn;
        const meta = getVariantMeta(v);

        return (
          <button
            key={v}
            onClick={() => {
              if (isLocked) {
                onRequireLogin();
                return;
              }
              onChange(v);
              onResetStep();
            }}
            className={`flex-1 flex justify-center items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition-all active:scale-95 touch-manipulation select-none ${
              activeVariant === v
                ? "bg-white text-primary shadow-sm ring-1 ring-primary/20"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            {isLocked && <Lock size={12} className="mt-0.5" />}
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

function InstructionPanel({ meta }: { meta: any }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 rounded-2xl bg-linear-to-br from-primary/5 to-secondary/5 p-6 border border-primary/10">
        <h4 className="flex items-center gap-2 text-lg font-black text-primary">
          <HeartHandshake size={20} />
          Tentang Test {meta.label}
        </h4>
        <p className="mt-3 text-sm leading-relaxed text-[#555]">
          {meta.purpose}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
           <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold">
              <Info size={16} />
              <span className="text-sm">Fokuskan Diri</span>
           </div>
           <p className="text-xs text-blue-900/70 leading-relaxed">
             Jawab setiap pertanyaan sejujur mungkin. Jangan memikirkan apa yang "seharusnya" kamu rasakan, tapi apa yang "sebenarnya" kamu rasakan.
           </p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
           <div className="flex items-center gap-2 mb-2 text-amber-700 font-bold">
              <AlertCircle size={16} />
              <span className="text-sm">Tips Mengisi</span>
           </div>
           <p className="text-xs text-amber-900/70 leading-relaxed">
             Klik angka di sepanjang skala penilaian yang paling mewakili kondisimu secara alami. Jangan terlalu lama berpikir!
           </p>
        </div>
      </div>
    </div>
  );
}

function QuestionsPanel({
  answers,
  questions,
  scaleOptions,
  onPick,
}: {
  answers: Record<number, number>;
  questions: any[];
  scaleOptions: number[];
  onPick: (id: number, val: number) => void;
}) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {questions.map((q, idx) => (
        <div key={q.id} className="group">
          <div className="flex items-start gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">
              {idx + 1}
            </span>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-[#444] leading-relaxed md:text-base pr-2">{q.text}</p>
              
              <div className="mt-5 w-full overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex flex-nowrap md:flex-wrap gap-2 md:gap-3 min-w-max">
                  {scaleOptions.map((val) => (
                    <button
                      key={val}
                      onClick={() => onPick(q.id, val)}
                      className={`flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl text-base font-black transition-all active:scale-90 touch-manipulation select-none shrink-0 ${
                        answers[q.id] === val
                          ? "bg-primary text-white scale-110 shadow-lg ring-4 ring-primary/20"
                          : "bg-white text-gray-500 border-2 border-gray-100 hover:border-primary/30 hover:text-primary hover:bg-primary/5 shadow-sm"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {(q.leftLabel || q.rightLabel) && (
                <div className="mt-1 flex justify-between px-1 text-[10px] font-black uppercase tracking-widest text-[#bbb]">
                  <span>{q.leftLabel}</span>
                  <span>{q.rightLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultPanel({
  result,
  answeredCount,
  totalQuestionCount,
  setShowShareCard,
  isPro,
  router,
  pathname,
}: {
  result: StandardTestResult;
  answeredCount: number;
  totalQuestionCount: number;
  setShowShareCard: (v: boolean) => void;
  isPro: boolean;
  router: any;
  pathname: string;
}) {
  const hasPartialAnswers = answeredCount > 0 && answeredCount < totalQuestionCount;

  if (hasPartialAnswers) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-amber-50 p-4 text-amber-500">
          <AlertTriangle size={48} />
        </div>
        <h3 className="mt-4 text-xl font-black text-[#444]">Belum Selesai</h3>
        <p className="mt-2 max-w-sm text-sm text-[#888]">
          Kamu baru menjawab {answeredCount} dari {totalQuestionCount} soal. Selesaikan semua soal untuk melihat hasil analisis.
        </p>
      </div>
    );
  }

  const renderIcon = (iconName: string, className?: string) => {
    const props = { size: 15, className };
    switch (iconName) {
      case "check": return <Check {...props} />;
      case "alert": return <AlertCircle {...props} />;
      case "heart": return <HeartHandshake {...props} />;
      case "star": return <Sparkles {...props} />;
      case "info":
      default:
        return <Info {...props} />;
    }
  };

  return (
    <div className="animate-in fade-in duration-1000">
      <div className="mb-8 rounded-3xl bg-linear-to-br from-primary/20 via-blue-200/10 to-secondary/20 p-6 border border-white/40 shadow-xl backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
          <Sparkles size={40} className="text-secondary" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary-hovered mb-1">Spread the Love</p>
            <h3 className="text-xl md:text-2xl font-black text-[#535252]">Hasilmu Iconic Banget! ✨</h3>
            <p className="mt-1 text-sm font-medium text-[#7a7a7a]">Bagikan insight ini ke Instagram Story atau feed-mu.</p>
          </div>
          <button
            onClick={() => setShowShareCard(true)}
            className="btn bg-white text-primary border-2 border-primary/20 hover:border-primary px-8 py-3 rounded-2xl flex items-center gap-2 shadow-lg hover:shadow-primary/20 transition-all font-black shrink-0"
          >
            <Share2 size={18} />
            Share ke IG
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">{result.title}</p>
            <h4 className="text-3xl font-black text-[#3d3d3d] leading-tight">
              {result.primaryResult}
            </h4>
            {result.tags && result.tags.length > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-1.5 text-xs font-black text-primary">
                <Sparkles size={14} />
                {result.tags[0]}
              </div>
            )}
            <p className="mt-4 text-sm leading-relaxed text-[#666] whitespace-pre-line">{result.description}</p>
          </div>

          {result.scoreBars.length > 0 && (
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Dimensi Penilaian</p>
              <div className="space-y-4">
                {result.scoreBars.map((bar, idx) => (
                  <div key={bar.label} className="space-y-1.5">
                    <div className="flex justify-between items-end text-xs font-bold text-[#555]">
                      <span>{bar.label}</span>
                      <span className="text-[10px] font-black">{bar.valueText || `${bar.percentage}%`}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          bar.colorClass || (idx === 0 ? "bg-primary" : idx === 1 ? "bg-primary/80" : "bg-primary/60")
                        }`}
                        style={{ width: `${bar.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`rounded-3xl p-6 border shadow-sm ${isPro ? "bg-primary/5 border-primary/10" : "bg-white border-gray-100"} flex flex-col`}>
           <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-5">Insight & Reflection</p>
           
           <div className="space-y-6 flex-1">
             {result.sections.map((section, idx) => {
               if (section.type === "text") {
                 const isLockedBanner = section.title === "Buka Analisis Mendalam";
                 if (isLockedBanner) {
                    return (
                      <div key={idx} className="h-100 mt-4 rounded-3xl bg-linear-to-br from-amber-50 to-orange-50/50 p-6 border border-amber-100 flex flex-col items-center justify-center text-center">
                        <div className="mb-4 rounded-2xl bg-white p-3 shadow-sm text-amber-500">
                          <Lock size={24} />
                        </div>
                        <h5 className="text-base font-black text-[#444]">{section.title}</h5>
                        <p className="mt-2 text-xs leading-relaxed text-[#666] mb-5">
                          {section.text}
                        </p>
                        <div className="space-y-2 w-full">
                          <div className="h-1.5 w-full bg-gray-200/50 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-200 w-1/3" />
                          </div>
                          <div className="h-1.5 w-full bg-gray-200/50 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-200 w-1/2" />
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/register?next=${encodeURIComponent(pathname)}`)} 
                          className="mt-6 text-xs font-black text-amber-600 hover:text-amber-700 underline underline-offset-4"
                        >
                          Coba Versi Pro
                        </button>
                      </div>
                    )
                 }

                 return (
                   <div key={idx} className={`p-4 rounded-2xl border ${section.bgColorClass || "bg-white border-gray-100"}`}>
                     <h5 className="text-sm font-black text-[#444] mb-2 flex items-center gap-2">
                       {renderIcon(section.icon, "text-primary")}
                       {section.title}
                     </h5>
                     <p className="text-xs leading-relaxed text-[#666] whitespace-pre-line">{section.text}</p>
                   </div>
                 );
               }

               if (section.type === "list") {
                 return (
                   <div key={idx} className={`p-4 rounded-2xl border ${section.bgColorClass || "bg-white border-gray-100"}`}>
                     <h5 className="text-sm font-black text-[#444] mb-3 flex items-center gap-2">
                       {renderIcon(section.icon, "text-primary")}
                       {section.title}
                     </h5>
                     <ul className="space-y-2 pl-1">
                       {section.items?.map((item, i) => (
                         <li key={i} className="flex gap-2 text-xs text-[#666] leading-relaxed">
                           <span className="text-primary mt-0.5">•</span>
                           <span>{item}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 );
               }

               if (section.type === "tags") {
                 return (
                   <div key={idx} className={`p-4 rounded-2xl border ${section.bgColorClass || "bg-white border-gray-100"}`}>
                     <h5 className="text-sm font-black text-[#444] mb-3 flex items-center gap-2">
                       {renderIcon(section.icon, "text-primary")}
                       {section.title}
                     </h5>
                     <div className="flex flex-wrap gap-2">
                       {section.items?.map((item, i) => (
                         <span key={i} className="inline-flex rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-[#555]">
                           {item}
                         </span>
                       ))}
                     </div>
                   </div>
                 );
               }
               return null;
             })}
           </div>
        </div>
      </div>
    </div>
  );
}
