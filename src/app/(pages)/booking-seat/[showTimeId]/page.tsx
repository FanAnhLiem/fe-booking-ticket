// src/app/(pages)/booking-seat/[showTimeId]/page.tsx

import SeatBookingPage from '@/components/booking/SeatBookingPage';

export default function BookingSeatPage({
  params,
}: {
  params: { showTimeId: string };
}) {
  return <SeatBookingPage showTimeId={params.showTimeId} />;
}
