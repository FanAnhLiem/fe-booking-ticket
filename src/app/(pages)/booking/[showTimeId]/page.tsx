import SeatBookingPage from './SeatBookingPage';

export default async function BookingPage({
  params,
}: {
  params: Promise<{ showTimeId: string }>;
}) {
  const { showTimeId } = await params;

  return <SeatBookingPage showTimeId={showTimeId} />;
}
