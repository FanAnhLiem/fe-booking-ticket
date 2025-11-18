import ListMovie from '@/components/movies/list_movie';

export default function MovieShowing() {
  const url = 'https://6900a8ddff8d792314bade49.mockapi.io/api/movie';
  return (
    <div className=" mt-8">
      <div className="max-w-[1050px] m-0 mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 border-l-4 border-blue-600 pl-4 mx-2">
          Phim Sắp Chiếu
        </h2>
        <ListMovie url={url} />
      </div>
    </div>
  );
}
