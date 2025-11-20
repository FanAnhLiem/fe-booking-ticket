import BookingShowtime from '@/components/booking/BookingShowtime';

export default function BookingPage({
  params,
}: {
  params: { id: string };
}) {
  const movieId = Number(params.id);

  return (
    <div className="mt-6">
      <BookingShowtime movieId={movieId} />
    </div>
  );
}
