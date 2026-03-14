import LoginClient from "@/components/LoginClient";
import TestNavbar from "@/components/TestNavbar";

const getNextHref = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] || "/";
  }

  return value || "/";
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextHref = getNextHref(resolvedSearchParams.next);

  return (
    <div className="pb-12">
      <TestNavbar />
      <main className="pt-24 md:pt-28">
        <LoginClient nextHref={nextHref} />
      </main>
    </div>
  );
}
