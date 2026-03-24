import { YouTubeFilterBarSkeleton } from '@/components/youtubehot/YouTubeFilterBarSkeleton';
import { YouTubeHotVideoCard } from '@/components/youtubehot/YouTubeHotVideoCard';

export default function YouTubeHotLoading() {
  const initialSkeletonCount = 20;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-100 via-zinc-50 to-white pb-10 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <section className="mx-auto w-full max-w-[1920px] lg:max-w-[80%] px-4 pt-6 md:px-6 md:pt-8">
        <YouTubeFilterBarSkeleton />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: initialSkeletonCount }).map((_, idx) => (
            <YouTubeHotVideoCard key={idx} loading />
          ))}
        </div>
      </section>
    </main>
  );
}
