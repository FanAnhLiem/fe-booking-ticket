import UserTable from '@/components/user/UserTable';
import { UserType } from '@/types/alltypes';

export default async function UsersPage() {
  const url = 'https://691a973a2d8d7855756f52b8.mockapi.io/api/user';
  let listUsers: UserType[] = [];

  try {
    // fetch với no-store để không bị cache dữ liệu cũ
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }
    listUsers = await res.json();
  } catch (error) {
    console.log('Lỗi lấy danh sách User: ', error);
  }

  return (
    <div className="min-h-screen p-4 flex-1 flex justify-center items-start">
     
      
      {/* Truyền dữ liệu xuống bảng */}
      <UserTable listUsers={listUsers} />
    </div>
  );
}