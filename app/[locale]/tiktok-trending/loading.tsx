function TikTokTrendingLoading() {
  return (
    <main className="min-h-screen bg-[#090a0d] pb-10 text-zinc-100">
      <section className="mx-auto flex w-full max-w-[1900px] flex-col gap-4 px-4 pt-3 md:px-6 md:pt-6 xl:px-8">
        <div className="h-64 animate-pulse rounded-[28px] border border-white/8 bg-[#131418]" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[620px] animate-pulse rounded-[24px] border border-white/8 bg-[#131418]" />
          ))}
        </div>
      </section>
    </main>
  );
}

export default TikTokTrendingLoading;
