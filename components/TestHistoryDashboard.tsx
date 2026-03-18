"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, ArrowRight, ClipboardList, Database } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import type { TestResultRow, HistoryApiResponse } from "@/types/results";
import { getAuthHeader } from "@/lib/clientAuth";

export default function TestHistoryDashboard() {
  const [results, setResults] = useState<TestResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await getAuthHeader();
      const response = await fetch("/api/tests/results", { headers });
      if (!response.ok) {
        throw new Error("Gagal memuat riwayat test.");
      }
      const data = (await response.json()) as HistoryApiResponse;
      setResults(data.results || []);
    } catch (err) {
      console.error("Dashboard history error:", err);
      setError("Terjadi kesalahan saat mengambil data riwayat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#888]">
        <Database className="animate-pulse mb-3" size={32} />
        <p className="text-sm font-medium">Memuat riwayat testmu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button 
          onClick={fetchHistory}
          className="mt-3 text-xs font-bold uppercase tracking-widest text-red-800 hover:underline"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-4xl border-2 border-dashed border-gray-100 bg-gray-50/30 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
          <ClipboardList className="text-gray-300" size={32} />
        </div>
        <h3 className="text-lg font-black text-[#444]">Belum Ada Riwayat</h3>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#888]">
          Kamu belum pernah menyelesaikan test apapun. Mulai test pertamamu sekarang!
        </p>
        <Link 
          href="/" 
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hovered hover:scale-105 active:scale-95"
        >
          Lihat Katalog Test
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((res) => {
        const testDate = new Date(res.created_at);
        const testName = res.test_slug.includes("love-language") 
          ? "Love Language Mapping" 
          : res.test_slug.includes("attachment") 
            ? "Attachment Reflection" 
            : res.test_slug;
        
        const resultLabel = res.score_data?.primary || res.score_data?.label || "Hasil Tersimpan";

        return (
          <div 
            key={res.id} 
            className="group relative overflow-hidden rounded-4xl border border-primary/10 bg-white p-6 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <Clock size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#bbb]">
                {format(testDate, "d MMM yyyy", { locale: id })}
              </span>
            </div>

            <h4 className="text-xs font-black uppercase tracking-[0.15em] text-primary/60">
              {res.variant ? `${testName} (${res.variant})` : testName}
            </h4>
            <p className="mt-1 text-xl font-black text-[#444] line-clamp-1">{resultLabel}</p>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-primary/10" />
                ))}
              </div>
              <Link 
                href={`/tests/${res.test_slug.replace('love-language-', '').replace('attachment-', '')}?resultId=${res.id}`}
                className="inline-flex items-center gap-2 text-sm font-black text-primary transition-transform group-hover:translate-x-1"
              >
                Lihat Detail
                <ArrowRight size={14} />
              </Link>
            </div>
            
            {/* Subtle background decoration */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
          </div>
        );
      })}
    </div>
  );
}
