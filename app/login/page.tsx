import LoginClient from "@/components/LoginClient";
import TestNavbar from "@/components/TestNavbar";

export default function LoginPage() {
  return (
    <div className="pb-12">
      <TestNavbar />
      <main className="pt-24 md:pt-28">
        <LoginClient />
      </main>
    </div>
  );
}
