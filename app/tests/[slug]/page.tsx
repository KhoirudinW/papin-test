import TestNavbar from "@/components/TestNavbar";
import TestDetailClient from "@/components/TestDetailClient";

export default async function TestDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="pb-12">
      <TestNavbar />
      <main className="pt-24 md:pt-28">
        <TestDetailClient slug={slug} />
      </main>
    </div>
  );
}
