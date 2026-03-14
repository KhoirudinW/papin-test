import MainMenuClient from "@/components/MainMenuClient";
import TestNavbar from "@/components/TestNavbar";

export default function HomePage() {
  return (
    <div className="pb-12">
      <TestNavbar />
      <main className="pt-24 md:pt-28">
        <MainMenuClient />
      </main>
    </div>
  );
}
