import BookingShowtime from '@/components/booking/BookingShowtime';

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;   // ✅ Bắt buộc phải await
  const movieId = Number(id);

  return (
    <div className="mt-6">
      <BookingShowtime movieId={movieId} />
    </div>
  );
}
