'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Upload, Film, ChevronLeft } from 'lucide-react';

// URL backend
const BASE_API = 'http://localhost:8080/api';
const MOVIE_ADMIN_API = `${BASE_API}/admin/movie`;

// Lấy Authorization header từ localStorage
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

// Chuyển yyyy-MM-dd -> dd/MM/yyyy cho backend
const toDDMMYYYY = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

interface MovieFormState {
  name: string;
  description: string;
  duration: string; // lưu dạng string rồi convert sang số khi submit
  category: string;
  country: string;
  director: string;
  actors: string;
  ageLimit: string;
  trailer: string;
  releaseDate: string; // yyyy-MM-dd (input type="date")
  endDate: string;     // yyyy-MM-dd
}

export default function AdminMovieCreateForm() {
  const router = useRouter();

  const [form, setForm] = useState<MovieFormState>({
    name: '',
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

  // handle change chung cho input text
  const handleChange =
    (field: keyof MovieFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  // chọn file poster
  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // validate đơn giản + submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Tên phim không được để trống');
      return;
    }

    if (!form.category.trim()) {
      toast.error('Thể loại không được để trống');
      return;
    }

    if (!form.duration || Number.isNaN(Number(form.duration))) {
      toast.error('Thời lượng phải là số (phút)');
      return;
    }

    if (!form.releaseDate || !form.endDate) {
      toast.error('Vui lòng chọn ngày khởi chiếu và ngày kết thúc');
      return;
    }

    const release = new Date(form.releaseDate);
    const end = new Date(form.endDate);
    if (release > end) {
      toast.error('Ngày khởi chiếu phải trước hoặc bằng ngày kết thúc');
      return;
    }

    if (!posterFile) {
      toast.error('Vui lòng chọn poster cho phim');
      return;
    }

    // build FormData gửi đúng format backend
    const fd = new FormData();
    fd.append('poster', posterFile);

    fd.append('name', form.name.trim());
    fd.append('description', form.description.trim());
    fd.append('duration', String(Number(form.duration)));
    fd.append('category', form.category.trim());
    fd.append('country', form.country.trim());
    fd.append('director', form.director.trim());
    fd.append('actors', form.actors.trim());
    fd.append('ageLimit', form.ageLimit ? String(Number(form.ageLimit)) : '0');
    fd.append('trailer', form.trailer.trim());

    fd.append('releaseDate', toDDMMYYYY(form.releaseDate));
    fd.append('endDate', toDDMMYYYY(form.endDate));

    setIsSubmitting(true);
    try {
      const res = await fetch(MOVIE_ADMIN_API, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(), // KHÔNG set Content-Type, để browser tự set boundary
        },
        body: fd,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || data.code !== 0) {
        throw new Error(data?.message || 'Tạo phim thất bại');
      }

      toast.success('Tạo phim thành công', {
        description: `Phim "${form.name}" đã được thêm vào hệ thống.`,
      });

      // reset form 1 chút cho sạch
      setForm({
        name: '',
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
      setPosterFile(null);
      setPreviewUrl(null);

      // chuyển về trang danh sách phim admin
      router.push('/admin/movies');
    } catch (error: any) {
      console.error('Create movie error:', error);
      toast.error('Tạo phim thất bại', {
        description: error.message || 'Có lỗi xảy ra, vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      {/* Header nhỏ */}
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
          <h1 className="font-semibold text-lg">Tạo phim mới</h1>
        </div>
        <div className="w-16" /> {/* spacer cho cân hai bên */}
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
                    Khuyến nghị tỉ lệ 2:3, dung lượng vừa phải
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
                  Ngày khởi chiếu <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  value={form.releaseDate}
                  onChange={handleChange('releaseDate')}
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-xs text-slate-700">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  value={form.endDate}
                  onChange={handleChange('endDate')}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-xs text-slate-700">
                Link trailer
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="Dán link YouTube hoặc video trailer..."
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

        {/* Action buttons */}
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
            Tạo phim
          </button>
        </div>
      </form>
    </div>
  );
}
