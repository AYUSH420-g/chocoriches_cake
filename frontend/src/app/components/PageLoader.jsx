export default function PageLoader() {
  return (
    <div className="bk-page min-h-[80vh] p-4 md:p-8 animate-pulse">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-8 w-1/3 rounded-lg bg-[#f1f1f1]"></div>
        <div className="h-4 w-1/2 rounded-lg bg-[#f1f1f1]"></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="aspect-[4/5] rounded-2xl bg-[#f5f0ec]"></div>
          <div className="aspect-[4/5] rounded-2xl bg-[#f5f0ec]"></div>
          <div className="aspect-[4/5] rounded-2xl bg-[#f5f0ec] hidden lg:block"></div>
        </div>
      </div>
    </div>
  );
}
