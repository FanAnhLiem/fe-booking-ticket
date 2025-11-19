'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, Film, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

type Mode = 'create' | 'edit';

interface AdminMovieFormProps {
  mode: Mode;
  movieId?: number;        // bắt buộc khi mode = 'edit'
  initialName?: string;    // optional: truyền tên từ list sang (cho chắc)
}

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

// state form
interface MovieFormState {
  name: string;
  description: string;
  duration: string;
  category: string;
  country: string;
  director: string;
  actors: string;
  ageLimit: string;
  trailer: string;
  releaseDate: string; // dd/MM/yyyy (theo backend)
  endDate: string;     // dd/MM/yyyy
}


export default function AdminMovieForm({
  mode,
  movieId,
  initialName = '',
}: AdminMovieFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<MovieFormState>({
    name: initialName,
    description: '',
    duration: '',
    category: '',
    country: '',
    director: '',
    actors: '',
    ageLimit: '',
    trailer: '',
    releaseDate: '',
    endDate: '',
  });

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(
    mode === 'edit' ? true : false
  );

  // ----- handle change -----
  const handleChange =
    (field: keyof MovieFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // ----- load detail khi mode = edit -----
  useEffect(() => {
    const fetchDetail = async () => {
      if (mode !== 'edit' || !movieId) return;

      try {
        const res = await fetch(`${MOVIE_DETAIL_API}/${movieId}`);
        const data = await res.json();

        if (!res.ok || !data.result) {
          throw new Error('Không lấy được thông tin phim');
        }

        const m = data.result;
        setForm({
          name: m.name || initialName,
          description: m.description || '',
          duration: m.duration ? String(m.duration) : '',
          category: m.category || '',
          country: m.country || '',
          director: m.director || '',
          actors: m.actors || '',
          ageLimit: m.ageLimit ? String(m.ageLimit) : '',
          trailer: m.trailer || '',
          releaseDate: m.releaseDate || '',
          endDate: m.endDate || '',
        });
        setPreviewUrl(m.posterUrl || null);
      } catch (err) {
        console.error('Fetch movie detail failed: ', err);
        toast.error('Không tải được thông tin phim');
        router.push('/admin/movies');
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, movieId]);

  // ----- validate đơn giản -----
  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error('Tên phim không được để trống');
      return false;
    }

    if (!form.category.trim()) {
      toast.error('Thể loại không được để trống');
      return false;
    }

    if (!form.duration || Number.isNaN(Number(form.duration))) {
      toast.error('Thời lượng phải là số (phút)');
      return false;
    }

    if (!form.releaseDate.trim() || !form.endDate.trim()) {
      toast.error('Vui lòng nhập ngày khởi chiếu và ngày kết thúc (dd/MM/yyyy)');
      return false;
    }

    if (!form.trailer.trim()) {
      toast.error('Vui lòng nhập link trailer (URL), KHÔNG dán iframe');
      return false;
    }

    // với create & edit đều bắt chọn poster (do backend yêu cầu poster trong multipart)
    if (!posterFile && mode === 'create') {
      toast.error('Vui lòng chọn poster cho phim');
      return false;
    }
    if (!posterFile && mode === 'edit') {
      toast.error('Vui lòng chọn poster mới khi cập nhật');
      return false;
    }

    return true;
  };

  // ----- submit (create / edit dùng chung) -----
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const fd = new FormData();
    if (posterFile) {
      fd.append('poster', posterFile);
    }

    fd.append('name', form.name.trim());
    fd.append('description', form.description.trim());
    fd.append('duration', String(Number(form.duration)));
    fd.append('category', form.category.trim());
    fd.append('country', form.country.trim());
    fd.append('director', form.director.trim());
    fd.append('actors', form.actors.trim());
    fd.append('ageLimit', form.ageLimit ? String(Number(form.ageLimit)) : '0');
    fd.append('trailer', form.trailer.trim());
    fd.append('releaseDate', form.releaseDate.trim());
    fd.append('endDate', form.endDate.trim());

    setIsSubmitting(true);
    try {
      let res: Response;

      if (mode === 'create') {
        res = await fetch(MOVIE_ADMIN_API, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            // KHÔNG set Content-Type
          },
          body: fd,
        });
      } else {
        res = await fetch(`${MOVIE_ADMIN_API}/${movieId}`, {
          method: 'PUT',
          headers: {
            ...getAuthHeaders(),
          },
          body: fd,
        });
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.code !== 0) {
        throw new Error(data?.message || 'Lỗi khi lưu phim');
      }

      toast.success(
        mode === 'create' ? 'Tạo phim thành công' : 'Cập nhật phim thành công'
      );

      router.push('/admin/movies');
    } catch (error: any) {
      console.error('Save movie error:', error);
      toast.error(
        error.message ||
          (mode === 'create'
            ? 'Tạo phim thất bại, vui lòng thử lại.'
            : 'Cập nhật phim thất bại, vui lòng thử lại.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDetail) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-10 flex justify-center items-center text-sm text-slate-600">
        <Loader2 className="animate-spin mr-2" size={18} />
        Đang tải dữ liệu phim...
      </div>
    );
  }

  const title =
    mode === 'create' ? 'Tạo phim mới' : `Cập nhật phim #${movieId || ''}`;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 mb-12">
      {/* Header nhỏ + back */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-black"
        >
          <ChevronLeft size={16} />
          Quay lại
        </button>
        <div className="flex items-center gap-2">
          <Film size={20} className="text-slate-700" />
          <h1 className="font-semibold text-lg">{title}</h1>
        </div>
        <div className="w-16" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border px-6 py-6 space-y-6"
      >
        {/* Poster + thông tin chính */}
        <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
          {/* Poster */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-700">Poster phim</p>
            <div className="w-full aspect-[2/3] rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden bg-slate-50">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Poster preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-xs text-slate-400">
                  <Upload size={24} className="mb-2" />
                  <span>Chưa chọn poster</span>
                  <span className="text-[11px] mt-1">
                    Chọn hình ảnh tỉ lệ 2:3, dung lượng vừa phải
                  </span>
                </div>
              )}
            </div>
            <label className="inline-flex items-center px-3 py-2 rounded-lg border bg-white text-xs cursor-pointer hover:bg-slate-50">
              <Upload size={14} className="mr-2" />
              Chọn file poster
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePosterChange}
              />
            </label>
          </div>

          {/* Thông tin phim */}
          <div className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className="font-medium text-xs text-slate-700">
                Tên phim <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="Nhập tên phim..."
                value={form.name}
                onChange={handleChange('name')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Thể loại <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="Ví dụ: Hành động, Tình cảm..."
                  value={form.category}
                  onChange={handleChange('category')}
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Quốc gia
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="Ví dụ: Mỹ, Việt Nam..."
                  value={form.country}
                  onChange={handleChange('country')}
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Thời lượng (phút) <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  type="number"
                  min={1}
                  placeholder="Ví dụ: 120"
                  value={form.duration}
                  onChange={handleChange('duration')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Đạo diễn
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="Tên đạo diễn..."
                  value={form.director}
                  onChange={handleChange('director')}
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Diễn viên
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="Danh sách diễn viên, cách nhau bởi dấu phẩy"
                  value={form.actors}
                  onChange={handleChange('actors')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Giới hạn tuổi
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  type="number"
                  min={0}
                  placeholder="VD: 13, 16, 18..."
                  value={form.ageLimit}
                  onChange={handleChange('ageLimit')}
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Ngày khởi chiếu (dd/MM/yyyy)
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="VD: 25/12/2025"
                  value={form.releaseDate}
                  onChange={handleChange('releaseDate')}
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Ngày kết thúc (dd/MM/yyyy)
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="VD: 10/01/2026"
                  value={form.endDate}
                  onChange={handleChange('endDate')}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-xs text-slate-700">
                Link trailer (chỉ URL, KHÔNG dán &lt;iframe&gt;)
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="Ví dụ: https://www.youtube.com/embed/xxxx"
                value={form.trailer}
                onChange={handleChange('trailer')}
              />
            </div>
          </div>
        </div>

        {/* Mô tả */}
        <div className="space-y-1 text-sm">
          <label className="font-medium text-xs text-slate-700">
            Mô tả phim
          </label>
          <textarea
            className="w-full min-h-[120px] border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400 resize-y"
            placeholder="Nhập tóm tắt nội dung phim..."
            value={form.description}
            onChange={handleChange('description')}
          />
        </div>

        {/* Nút */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            className="px-3 py-2 text-sm rounded-lg border bg-white hover:bg-slate-50"
            onClick={() => router.push('/admin/movies')}
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="animate-spin" size={16} />}
            {mode === 'create' ? 'Tạo phim' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
