import AdminMovieForm from '@/components/movies/AdminMovieForm';

export default function AdminMovieCreatePage() {
  return (
    <div className="flex-1 flex justify-center items-start">
      <AdminMovieForm mode="create" />
    </div>
  );
}
