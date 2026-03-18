import { Suspense } from "react";
import RegisterClient from "@/components/RegisterClient";
import TestNavbar from "@/components/TestNavbar";

export default function RegisterPage() {
  return (
    <div className="pb-12 bg-linear-to-b from-[#fffcfd] to-[#fff5f8] min-h-screen">
      <TestNavbar />
      <main className="pt-24 md:pt-32">
        <Suspense fallback={<div className="text-center py-20 text-[#888]">Memuat halaman pendaftaran...</div>}>
          <RegisterClient />
        </Suspense>
      </main>
    </div>
  );
}
