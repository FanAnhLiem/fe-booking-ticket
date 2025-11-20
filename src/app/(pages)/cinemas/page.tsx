import CinemaExplorer from '@/components/cinema/CinemaExplorer';

export default function CinemasPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <section className="container mx-auto px-4 pt-8">
        <CinemaExplorer />
      </section>
    </main>
  );
}
