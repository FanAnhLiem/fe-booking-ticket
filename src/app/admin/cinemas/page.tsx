import CinemasTable from '@/components/cinamas/CinemasTable';
import { TypeCinema } from '@/types/alltypes';

export default async function Cinemas() {
  const url = 'http://691a973a2d8d7855756f52b8.mockapi.io/api/cinemas';
  let listCinemas: TypeCinema[] = [];
  try {
    const res = await fetch(url);
    listCinemas = await res.json();
  } catch (error) {
    console.log('fail fetch api: ', error);
  }

  return (
    <div className='flex-1 flex justify-center items-start'>
      <CinemasTable listCinemas={listCinemas}/>
    </div>
  );
}
