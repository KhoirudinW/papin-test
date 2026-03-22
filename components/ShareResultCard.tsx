"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Download, Share2, X, Sparkles, Layout, Smartphone } from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   Types
 ────────────────────────────────────────────────────────────── */
export type ShareCardData = {
  testName: string; // "Love Language Mapping" | "Attachment Reflection"
  variant: "Lite" | "Pro";
  primaryLabel: string;
  secondaryLabel?: string;
  isBilingual?: boolean;
  profileType: string;
  profileDescription: string;
  tendencyText?: string; // e.g. Attachment tendency tagline
  signs: string[]; // max 3
  positiveTriggers: string[]; // max 3
  positiveTriggerLabel?: string; // override label kolom kanan (default: "Merasa Dicintai Saat")
  gapLabel?: string;
  gapPct?: number;
  format?: "square" | "portrait";
};

/* ──────────────────────────────────────────────────────────────
   Helper  – little floating heart
 ────────────────────────────────────────────────────────────── */
function FloatingHeart({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={style}
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   The actual shareable card (square 1100×1100 vibe)
 ────────────────────────────────────────────────────────────── */
function PAPinCard({ data, cardRef }: { data: ShareCardData; cardRef: React.RefObject<HTMLDivElement | null> }) {
  const signs = data.signs.slice(0, 3);
  const triggers = data.positiveTriggers.slice(0, 3);
  const isPortrait = data.format === "portrait";

  return (
    <div
      ref={cardRef}
      id="papin-share-card"
      style={{
        width: isPortrait ? 420 : 550,
        minHeight: isPortrait ? 746 : 550,
        background: "#ffffff",
        border: "1.5px solid rgba(255,175,204,0.25)",
        borderRadius: isPortrait ? 40 : 32,
        padding: 0,
        fontFamily: "'Poppins', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        flexShrink: 0,
        boxShadow: "0 2px 24px 0 rgba(255,175,204,0.10)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Accent Bar */}
      <div
        style={{
          height: isPortrait ? 10 : 6,
          width: "100%",
          background: "linear-gradient(90deg, #ffafcc 0%, #fa83ae 50%, #a2d2ff 100%)",
        }}
      />

      <div style={{ padding: isPortrait ? "50px 32px 40px" : 40, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* ── Header / Branding ─────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isPortrait ? 40 : 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "linear-gradient(135deg, #ffafcc, #fa83ae)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FloatingHeart size={18} style={{ color: "#fff" }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 900, color: "#fa83ae", letterSpacing: "0.14em", textTransform: "uppercase", margin: 0, lineHeight: 1.4 }}>
                PAPin
              </p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#c78fa8", margin: 0, marginTop: -2, lineHeight: 1.4 }}>
                {data.testName}
              </p>
            </div>
          </div>
          <div
            style={{
              borderRadius: 999,
              border: "1.5px solid rgba(255,175,204,0.4)",
              background: "rgba(255,255,255,0.7)",
              padding: "6px 14px",
              fontSize: 10,
              fontWeight: 900,
              color: "#fa83ae",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "center",
            }}
          >
            {data.variant} ✨
          </div>
        </div>

        {/* ── Primary result ────────────────────────────────── */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,240,248,0.9) 100%)",
            border: "1.5px solid rgba(255,175,204,0.35)",
            borderRadius: 24,
            padding: "22px 24px",
            marginBottom: isPortrait ? 24 : 16,
            backdropFilter: "blur(8px)",
            boxShadow: "0 8px 32px -8px rgba(255,131,174,0.2)",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: "#fa83ae",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: 0,
              marginBottom: 6,
              lineHeight: 1.4,
            }}
          >
            {data.isBilingual ? "Dua Bahasa Dominan" : "Hasil Utama"}
          </p>
          <h2 style={{ fontSize: isPortrait ? 36 : 30, fontWeight: 900, color: "#3d3d3d", margin: 0, lineHeight: 1.2 }}>
            {data.primaryLabel}
          </h2>
          {data.secondaryLabel && (
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fa83ae", margin: 0, marginTop: 4, lineHeight: 1.4 }}>
              + {data.secondaryLabel}
            </p>
          )}
          <div
            style={{
              marginTop: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              background: "rgba(255,175,204,0.15)",
              border: "1px solid rgba(255,175,204,0.3)",
              padding: "4px 12px",
            }}
          >
            <Sparkles size={11} color="#fa83ae" />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#c8548a", letterSpacing: "0.06em", lineHeight: 1.4 }}>
              {data.profileType}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#555", margin: 0, marginTop: 12, lineHeight: 1.6, fontWeight: 500 }}>
            {data.profileDescription}
          </p>
          {data.tendencyText && (
            <p style={{ fontSize: 12, color: "#fa83ae", margin: 0, marginTop: 10, lineHeight: 1.5, fontWeight: 700, fontStyle: "italic" }}>
              &ldquo;{data.tendencyText}&rdquo;
            </p>
          )}
        </div>

        {/* ── Two-column or Single-column pills ──────────────── */}
        <div style={{ display: "flex", flexDirection: isPortrait ? "column" : "row", gap: 12, marginBottom: isPortrait ? 24 : 16 }}>
          {/* Ciri-ciri */}
          <div
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.75)",
              border: "1.5px solid rgba(255,175,204,0.25)",
              borderRadius: 18,
              padding: isPortrait? "20px" : "16px",
            }}
          >
            <p style={{ fontSize: 9, fontWeight: 900, color: "#fa83ae", letterSpacing: "0.18em", textTransform: "uppercase", margin: 0, marginBottom: 10, lineHeight: 1.4 }}>
              Ciri-Cirimu
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {signs.map((s, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <span style={{ color: "#ffafcc", marginTop: 1, flexShrink: 0 }}>
                    <FloatingHeart size={9} />
                  </span>
                  <p style={{ fontSize: 11.5, color: "#444", margin: 0, lineHeight: 1.5, fontWeight: 600 }}>{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Merasa dicintai / Kelebihan */}
          <div
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.75)",
              border: "1.5px solid rgba(255,175,204,0.25)",
              borderRadius: 18,
              padding: isPortrait? "20px" : "16px",
            }}
          >
            <p style={{ fontSize: 9, fontWeight: 900, color: "#fa83ae", letterSpacing: "0.18em", textTransform: "uppercase", margin: 0, marginBottom: 10, lineHeight: 1.4 }}>
              {data.positiveTriggerLabel ?? "Merasa Dicintai Saat"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {triggers.map((t, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <span style={{ color: "#a2d2ff", marginTop: 1, flexShrink: 0 }}>✦</span>
                  <p style={{ fontSize: 11.5, color: "#444", margin: 0, lineHeight: 1.5, fontWeight: 600 }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Gap indicator (optional) ─────────────────────── */}
        {data.gapLabel && (
          <div
            style={{
              background: "rgba(255,255,255,0.6)",
              border: "1.5px solid rgba(255,175,204,0.2)",
              borderRadius: 16,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: isPortrait ? 30 : 20,
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: "#888", margin: 0, lineHeight: 1.4 }}>Ketegasan Preferensi</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {data.gapPct !== undefined && (
                <span style={{ fontSize: 16, fontWeight: 900, color: "#fa83ae", lineHeight: 1.2 }}>{data.gapPct}%</span>
              )}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#c8548a",
                  background: "rgba(255,175,204,0.15)",
                  borderRadius: 999,
                  padding: "3px 10px",
                  border: "1px solid rgba(255,175,204,0.3)",
                  lineHeight: 1.4,
                }}
              >
                {data.gapLabel}
              </span>
            </div>
          </div>
        )}

        {/* Spacer for Portrait */}
        {isPortrait && <div style={{ flex: 1 }} />}

        {/* ── Footer ────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,175,204,0.2)",
            paddingTop: 16,
            marginTop: isPortrait ? 0 : 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
             <Image src="/assets/logo.png" alt="PAPin" width={20} height={20} />
             <p style={{ fontSize: 11, color: "#c78fa8", fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
              papin.biz.id
            </p>
          </div>
          <p style={{ fontSize: 10, color: "#c78fa8", fontWeight: 600, margin: 0, letterSpacing: "0.04em", lineHeight: 1.4 }}>
            Kenali dirimu. Cintai dengan tepat. 💕
          </p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Modal wrapper + download logic (html2canvas based)
 ────────────────────────────────────────────────────────────── */
export default function ShareResultCard({
  data,
  onClose,
}: {
  data: ShareCardData;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [format, setFormat] = useState<"square" | "portrait">("square");

  const cardData: ShareCardData = { ...data, format };

  async function handleDownload() {
    if (!captureRef.current) return;
    setIsCapturing(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(captureRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `PAPin_${data.primaryLabel.replace(/\s+/g, "_")}_${format}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Screenshot failed:", err);
    } finally {
      setIsCapturing(false);
    }
  }

  async function handleShare() {
    if (!captureRef.current) return;
    setIsCapturing(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(captureRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `PAPin_Result_${format}.png`, { type: "image/png" });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Hasil Tes PAPin",
            text: `${data.testName} utamaku: ${data.primaryLabel} — cek tesmu di papin.app!`,
            files: [file],
          });
        } else {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `PAPin_Result_${format}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setIsCapturing(false);
      }, "image/png");
    } catch (err) {
      console.error("Share failed:", err);
      setIsCapturing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(30,15,25,0.75)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl my-auto">
        {/* Modal header */}
        <div className="mb-4 flex items-center justify-between px-1">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#ffafcc]">Share Hasilmu</p>
            <p className="mt-0.5 text-sm font-bold text-white/70">Pilih format & bagikan ke IG ✨</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Format Selector */}
        <div className="mb-5 flex justify-center gap-3">
            <button
              onClick={() => setFormat("square")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                format === "square" ? "bg-primary text-white scale-105 shadow-lg" : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              <Layout size={14} />
              Square (Feed)
            </button>
            <button
              onClick={() => setFormat("portrait")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                format === "portrait" ? "bg-primary text-white scale-105 shadow-lg" : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              <Smartphone size={14} />
              Portrait (Story)
            </button>
        </div>

        {/* Hidden card purely for html2canvas capturing */}
        <div style={{ position: "fixed", top: "-9999px", left: "-9999px", pointerEvents: "none" }}>
          <PAPinCard data={cardData} cardRef={captureRef} />
        </div>

        {/* Card preview wrapper with scale to fit smaller screens if needed */}
        <div className="flex justify-center scale-[0.85] sm:scale-100 origin-top">
          <PAPinCard data={cardData} cardRef={cardRef} />
        </div>

        {/* Action buttons */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isCapturing}
            className="btn bg-white/10 text-white border border-white/20 hover:bg-white/20 inline-flex items-center justify-center gap-2"
          >
            <Download size={15} />
            {isCapturing ? "Processing…" : "Simpan PNG"}
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={isCapturing}
            className="btn btn-primary-solid inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_-4px_rgba(255,175,204,0.6)]"
          >
            <Share2 size={15} />
            {isCapturing ? "Processing…" : "Bagikan"}
          </button>
        </div>
      </div>
    </div>
  );
}
