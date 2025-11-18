import { TypeMovie } from '@/types/alltypes';
import Movie from './movie';

export default async function ListMovie({ url }: { url: string }) {
  let data = [];
  try {
    const res = await fetch(url, { cache: 'no-store' });
    data = await res.json();
  } catch (error) {
    console.log(error);
  }

  return (
    <div className="container mx-auto px-2 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 gap-y-8">
        {data.map((movie: TypeMovie) => (
          <Movie key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
