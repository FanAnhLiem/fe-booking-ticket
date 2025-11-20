import { TypeMovie } from '@/types/alltypes';
import Movie from './movie';

interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

export default async function ListMovie({ url }: { url: string }) {
  let data: TypeMovie[] = [];

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json();

    // Trường hợp mockAPI trả về mảng thuần
    if (Array.isArray(json)) {
      data = json;
    } else {
      // Trường hợp backend Spring Boot: ApiResponse<{ result: MovieSummaryResponse[] }>
      const apiData = json as ApiResponse<TypeMovie[]>;
      if (apiData.result && Array.isArray(apiData.result)) {
        data = apiData.result;
      } else {
        data = [];
      }
    }
  } catch (error) {
    console.log(error);
  }

  return (
    <div className="container mx-auto px-2 py-10">
      {data.length === 0 ? (
        <div className="text-center text-sm text-gray-500 py-10">
          Hiện chưa có phim nào để hiển thị.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 gap-y-8">
          {data.map((movie: TypeMovie) => (
            <Movie key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
