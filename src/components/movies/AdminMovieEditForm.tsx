'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BASE_API = 'http://localhost:8080/api';
const MOVIE_ADMIN_API = `${BASE_API}/admin/movie`;
const MOVIE_DETAIL_API = `${BASE_API}/movie`;

// Lấy Authorization header từ localStorage
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

interface MovieDetailResponse {
  description: string;
  duration: number;
  category: string;
  country: string;
  director: string;
  actors: string;
  posterUrl: string;
  ageLimit: number;
  trailer: string;
  status: boolean;
  releaseDate: string; // backend trả String
  endDate: string;
  createAt: string;
}

export default function AdminMovieEditForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = Number(params?.id);
  const initialName = searchParams.get('name') || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form state
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [director, setDirector] = useState('');
  const [actors, setActors] = useState('');
  const [ageLimit, setAgeLimit] = useState('');
  const [trailer, setTrailer] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>('');

  // ====== LOAD DATA PHIM HIỆN TẠI ======
  useEffect(() => {
    const fetchDetail = async () => {
      if (!id || Number.isNaN(id)) {
        toast.error('ID phim không hợp lệ');
        router.push('/admin/movies');
        return;
      }

      try {
        const res = await fetch(`${MOVIE_DETAIL_API}/${id}`);
        const data = await res.json();

        if (!res.ok || !data.result) {
          throw new Error('Không lấy được thông tin phim');
        }

        const m: MovieDetailResponse = data.result;

        // name không có trong MovieDetailResponse → lấy từ URL nếu có
        setDescription(m.description || '');
        setDuration(m.duration ? String(m.duration) : '');
        setCategory(m.category || '');
        setCountry(m.country || '');
        setDirector(m.director || '');
        setActors(m.actors || '');
        setAgeLimit(m.ageLimit ? String(m.ageLimit) : '');
        setTrailer(m.trailer || '');
        setReleaseDate(m.releaseDate || '');
        setEndDate(m.endDate || '');
        setPosterPreview(m.posterUrl || '');
      } catch (error) {
        console.error('Fetch movie detail for edit failed: ', error);
        toast.error('Không tải được dữ liệu phim');
        router.push('/admin/movies');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // đổi file poster
  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPosterFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPosterPreview(url);
    }
  };

  // ====== SUBMIT UPDATE ======
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Tên phim không được để trống');
      return;
    }
    if (!duration.trim() || Number(duration) <= 0) {
      toast.error('Thời lượng phải là số phút > 0');
      return;
    }
    if (!category.trim()) {
      toast.error('Thể loại không được để trống');
      return;
    }
    if (!posterFile) {
      toast.error('Vui lòng chọn poster mới khi cập nhật');
      return;
    }
    if (!trailer.trim()) {
      toast.error('Vui lòng nhập link trailer (URL), không dán iframe');
      return;
    }

    const formData = new FormData();
    formData.append('poster', posterFile);

    // MovieRequest fields
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('duration', duration.trim());
    formData.append('category', category.trim());
    formData.append('country', country.trim());
    formData.append('director', director.trim());
    formData.append('actors', actors.trim());
    formData.append('ageLimit', ageLimit.trim() || '0');
    formData.append('trailer', trailer.trim());
    formData.append('releaseDate', releaseDate.trim());
    formData.append('endDate', endDate.trim());

    setSaving(true);
    try {
      const res = await fetch(`${MOVIE_ADMIN_API}/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          // KHÔNG set Content-Type, để browser tự set boundary cho FormData
        },
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.code && data.code !== 0)) {
        throw new Error(data?.message || 'Cập nhật phim thất bại');
      }

      toast.success('Cập nhật phim thành công');
      router.push('/admin/movies');
    } catch (error: any) {
      console.error('Update movie error:', error);
      toast.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-10 flex justify-center items-center text-sm text-slate-600">
        <Loader2 className="animate-spin mr-2" size={18} />
        Đang tải dữ liệu phim...
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 mb-12">
      <button
        type="button"
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-black"
        onClick={() => router.push('/admin/movies')}
      >
        <ArrowLeft size={16} />
        Quay lại danh sách phim
      </button>

      <h1 className="text-lg font-semibold mb-4">Cập nhật phim</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border px-6 py-6 space-y-6"
      >
        {/* Hàng 1: Tên + Thời lượng + Giới hạn tuổi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="name">Tên phim</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên phim..."
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="duration">Thời lượng (phút)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Ví dụ: 120"
            />
          </div>

          <div>
            <Label htmlFor="ageLimit">Giới hạn tuổi</Label>
            <Input
              id="ageLimit"
              type="number"
              min={0}
              value={ageLimit}
              onChange={(e) => setAgeLimit(e.target.value)}
              placeholder="Ví dụ: 16"
            />
          </div>
        </div>

        {/* Hàng 2: Thể loại + Quốc gia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Thể loại</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Hành động, Tâm lý..."
            />
          </div>
          <div>
            <Label htmlFor="country">Quốc gia</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Việt Nam, Mỹ, Hàn Quốc..."
            />
          </div>
        </div>

        {/* Hàng 3: Đạo diễn + Diễn viên */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="director">Đạo diễn</Label>
            <Input
              id="director"
              value={director}
              onChange={(e) => setDirector(e.target.value)}
              placeholder="Nhập tên đạo diễn"
            />
          </div>
          <div>
            <Label htmlFor="actors">Diễn viên</Label>
            <Input
              id="actors"
              value={actors}
              onChange={(e) => setActors(e.target.value)}
              placeholder="Danh sách diễn viên chính"
            />
          </div>
        </div>

        {/* Hàng 4: Ngày chiếu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="releaseDate">
              Ngày khởi chiếu (định dạng dd/MM/yyyy)
            </Label>
            <Input
              id="releaseDate"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              placeholder="Ví dụ: 25/12/2025"
            />
          </div>
          <div>
            <Label htmlFor="endDate">
              Ngày kết thúc (định dạng dd/MM/yyyy)
            </Label>
            <Input
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Ví dụ: 10/01/2026"
            />
          </div>
        </div>

        {/* Trailer */}
        <div>
          <Label htmlFor="trailer">
            Link trailer (YouTube / video URL){' '}
            <span className="text-xs text-slate-500">
              *Chỉ dán URL, không dán &lt;iframe&gt;
            </span>
          </Label>
          <Input
            id="trailer"
            value={trailer}
            onChange={(e) => setTrailer(e.target.value)}
            placeholder="Ví dụ: https://www.youtube.com/embed/xxxx"
          />
        </div>

        {/* Mô tả */}
        <div>
          <Label htmlFor="description">Mô tả</Label>
          <textarea
            id="description"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400 min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tóm tắt nội dung phim..."
          />
        </div>

        {/* Poster */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,200px] gap-4 items-start">
          <div>
            <Label htmlFor="poster">Poster phim</Label>
            <div className="mt-1 flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer bg-slate-50 hover:bg-slate-100">
                <Upload size={16} />
                <span>Chọn poster</span>
                <input
                  id="poster"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePosterChange}
                />
              </label>
              {posterFile && (
                <span className="text-xs text-slate-600">
                  Đã chọn: {posterFile.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Khi cập nhật cần chọn lại poster mới (backend yêu cầu trường
              <code> poster </code> trong multipart).
            </p>
          </div>

          <div className="w-full">
            {posterPreview ? (
              <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterPreview}
                  alt="Poster preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full aspect-[2/3] rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                Chưa có poster
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="px-4"
            onClick={() => router.push('/admin/movies')}
            disabled={saving}
          >
            Huỷ
          </Button>
          <Button
            type="submit"
            className="px-4"
            disabled={saving}
          >
            {saving && <Loader2 className="animate-spin mr-2" size={16} />}
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
