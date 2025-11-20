import ListMovie from '@/components/movies/list_movie';

const BASE_API = 'http://localhost:8080/api';

export default function MovieComingSoon() {
  const url = `${BASE_API}/movie/upcoming`; // BE: List<MovieSummaryResponse> (phim sắp chiếu)
  return (
    <div className="mt-8">
      <div className="max-w-[1050px] m-0 mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 border-l-4 border-blue-600 pl-4 mx-2">
          Phim Sắp Chiếu
        </h2>
        <ListMovie url={url} />
      </div>
    </div>
  );
}
