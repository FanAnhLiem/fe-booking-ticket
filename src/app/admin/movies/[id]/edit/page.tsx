'use client';

import AdminMovieForm from '@/components/movies/AdminMovieForm';
import { useParams } from 'next/navigation';

export default function AdminMovieEditPage() {
  const params = useParams();

  // params.id có thể là string hoặc string[]
  const rawId = params?.id;
  const movieId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  if (!movieId || Number.isNaN(movieId)) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-10 text-sm text-red-600">
        Không tìm thấy ID phim hợp lệ.
      </div>
    );
  }

  return (
    <div className="flex-1 flex justify-center items-start">
      <AdminMovieForm mode="edit" movieId={movieId} />
    </div>
  );
}
