import PricingClient from "@/components/PricingClient";
import TestNavbar from "@/components/TestNavbar";

export default function PricingPage() {
  return (
    <div className="pb-12">
      <TestNavbar />
      <main className="pt-24 md:pt-28">
        <PricingClient />
      </main>
    </div>
  );
}
