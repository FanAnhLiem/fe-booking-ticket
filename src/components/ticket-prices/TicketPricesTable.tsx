'use client';

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  ChangeEvent,
} from 'react';
import {
  Loader2,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

import {
  TicketPrice,
  ScreenRoomType,
} from '@/types/alltypes';

// ====== URL backend ======
const BASE_API = 'http://localhost:8080/api';
const PRICE_ADMIN_API = `${BASE_API}/admin/price`;
const CINEMA_TYPES_API = `${BASE_API}/admin/cinema/type`;
const SCREEN_TYPE_ADMIN_API = `${BASE_API}/admin/screenRoomType`;
const SEAT_TYPE_ADMIN_API = `${BASE_API}/admin/seatType`;

// Lấy Authorization header từ localStorage
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

type DayTypeFormValue = 'normal' | 'special';
type TimeFrameValue = 'Morning' | 'Noon' | 'Afternoon' | 'Evening';
type TimeFrameFormValue = '' | TimeFrameValue;

interface CinemaTypeOption {
  id: number;
  name: string;
}

interface SeatTypeOption {
  id: number;
  name: string;
  priceFactor: number;
}

interface AutoCandidate {
  key: string;
  cinemaType: CinemaTypeOption;
  screenType: ScreenRoomType;
  seatType: SeatTypeOption;
  timeFrame: TimeFrameValue;
  dayType: DayTypeFormValue;
  exists: boolean;
}

export default function TicketPricesTable() {
  const [prices, setPrices] = useState<TicketPrice[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [cinemaTypes, setCinemaTypes] = useState<CinemaTypeOption[]>([]);
  const [screenTypes, setScreenTypes] = useState<ScreenRoomType[]>([]);
  const [seatTypes, setSeatTypes] = useState<SeatTypeOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // search + filter + paging
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCinemaType, setFilterCinemaType] = useState<string>('All');
  const [filterScreenType, setFilterScreenType] = useState<string>('All');
  const [filterSeatType, setFilterSeatType] = useState<string>('All');
  const [filterTimeFrame, setFilterTimeFrame] = useState<string>('All');
  const [filterDayType, setFilterDayType] = useState<'All' | 'Normal' | 'Special'>('All');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // modal tạo/sửa 1 bản ghi
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPrice, setEditingPrice] = useState<TicketPrice | null>(null);

  const [formCinemaTypeId, setFormCinemaTypeId] = useState<number | ''>('');
  const [formScreenTypeId, setFormScreenTypeId] = useState<number | ''>('');
  const [formSeatTypeId, setFormSeatTypeId] = useState<number | ''>('');
  const [formTimeFrame, setFormTimeFrame] = useState<TimeFrameFormValue>('');
  const [formDayType, setFormDayType] = useState<DayTypeFormValue>('normal');

  // ====== AUTO-GENERATE STATE ======
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [autoTimeFrames, setAutoTimeFrames] =
    useState<Record<TimeFrameValue, boolean>>({
      Morning: true,
      Noon: true,
      Afternoon: true,
      Evening: true,
    });
  const [autoIncludeNormalDay, setAutoIncludeNormalDay] = useState(true);
  const [autoIncludeSpecialDay, setAutoIncludeSpecialDay] = useState(true);

  const [autoCandidates, setAutoCandidates] = useState<AutoCandidate[]>([]);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSummary, setAutoSummary] = useState<{
    total: number;
    existed: number;
    toCreate: number;
    success?: number;
    failed?: number;
  } | null>(null);

  // ====== FETCH OPTIONS ======
  const reloadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [cinemaRes, screenRes, seatRes] = await Promise.all([
        fetch(CINEMA_TYPES_API, { headers: { ...getAuthHeaders() } }),
        fetch(SCREEN_TYPE_ADMIN_API, { headers: { ...getAuthHeaders() } }),
        fetch(SEAT_TYPE_ADMIN_API, { headers: { ...getAuthHeaders() } }),
      ]);

      const [cinemaData, screenData, seatData] = await Promise.all([
        cinemaRes.json().catch(() => null),
        screenRes.json().catch(() => null),
        seatRes.json().catch(() => null),
      ]);

      if (cinemaRes.ok && Array.isArray(cinemaData?.result)) {
        const list: CinemaTypeOption[] = cinemaData.result.map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
        setCinemaTypes(list);
      } else {
        console.error('Get cinema types failed: ', cinemaData);
      }

      if (screenRes.ok && Array.isArray(screenData?.result)) {
        const list: ScreenRoomType[] = screenData.result.map((s: any) => ({
          id: s.id,
          name: s.name,
          priceFactor: s.priceFactor,
        }));
        setScreenTypes(list);
      } else {
        console.error('Get screen room types failed: ', screenData);
      }

      if (seatRes.ok && Array.isArray(seatData?.result)) {
        const list: SeatTypeOption[] = seatData.result.map((s: any) => ({
          id: s.id,
          name: s.name,
          priceFactor: s.priceFactor,
        }));
        setSeatTypes(list);
      } else {
        console.error('Get seat types failed: ', seatData);
      }
    } catch (error) {
      console.error('Fetch options (cinema/screen/seat) failed: ', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  // ====== FETCH PRICE LIST ======
  const reloadPrices = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(PRICE_ADMIN_API, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await res.json().catch(() => null);

      if (res.ok && Array.isArray(data?.result)) {
        const list: TicketPrice[] = data.result.map((item: any) => ({
          id: item.id,
          timeFrame: item.timeFrame,
          dayType: item.dayType,
          cinemaType: item.cinemaType,
          screenRoomType: item.screenRoomType,
          seatType: item.seatType,
          price: Number(item.price ?? 0),
        }));
        setPrices(list);
      } else {
        console.error('Get ticket prices wrong data: ', data);
      }
    } catch (error) {
      console.error('Get ticket prices failed: ', error);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void reloadOptions();
    void reloadPrices();
  }, []);

  // ====== SEARCH + FILTER + PAGING ======
  const filteredPrices = useMemo(() => {
    const lower = searchTerm.toLowerCase();

    return prices.filter((p) => {
      const matchSearch =
        !lower ||
        p.cinemaType.toLowerCase().includes(lower) ||
        p.screenRoomType.toLowerCase().includes(lower) ||
        p.seatType.toLowerCase().includes(lower) ||
        p.timeFrame.toLowerCase().includes(lower);

      const matchCinema =
        filterCinemaType === 'All' || p.cinemaType === filterCinemaType;
      const matchScreen =
        filterScreenType === 'All' || p.screenRoomType === filterScreenType;
      const matchSeat = filterSeatType === 'All' || p.seatType === filterSeatType;
      const matchTime =
        filterTimeFrame === 'All' || p.timeFrame === filterTimeFrame;
      const matchDayType =
        filterDayType === 'All' ||
        (filterDayType === 'Special' && p.dayType === 'Ngày lễ, cuối tuần') ||
        (filterDayType === 'Normal' && p.dayType === 'Ngày thường');

      return (
        matchSearch &&
        matchCinema &&
        matchScreen &&
        matchSeat &&
        matchTime &&
        matchDayType
      );
    });
  }, [
    prices,
    searchTerm,
    filterCinemaType,
    filterScreenType,
    filterSeatType,
    filterTimeFrame,
    filterDayType,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredPrices.length / itemsPerPage));

  const paginatedPrices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPrices.slice(start, start + itemsPerPage);
  }, [filteredPrices, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterCinemaType,
    filterScreenType,
    filterSeatType,
    filterTimeFrame,
    filterDayType,
  ]);

  // ====== HANDLERS UI CƠ BẢN ======

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingPrice(null);
    setFormCinemaTypeId('');
    setFormScreenTypeId('');
    setFormSeatTypeId('');
    setFormTimeFrame('');
    setFormDayType('normal');
    setIsModalOpen(true);
  };

  const openEditModal = (price: TicketPrice) => {
    setIsCreating(false);
    setEditingPrice(price);

    const cinema = cinemaTypes.find((c) => c.name === price.cinemaType);
    const screen = screenTypes.find((s) => s.name === price.screenRoomType);
    const seat = seatTypes.find((s) => s.name === price.seatType);

    setFormCinemaTypeId(cinema ? cinema.id : '');
    setFormScreenTypeId(screen ? screen.id : '');
    setFormSeatTypeId(seat ? seat.id : '');
    setFormTimeFrame(price.timeFrame as TimeFrameFormValue);
    setFormDayType(
      price.dayType === 'Ngày lễ, cuối tuần' ? 'special' : 'normal',
    );

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingPrice(null);
  };

  const handleSave = async () => {
    if (!formCinemaTypeId) {
      alert('Vui lòng chọn loại rạp');
      return;
    }
    if (!formScreenTypeId) {
      alert('Vui lòng chọn loại phòng chiếu');
      return;
    }
    if (!formSeatTypeId) {
      alert('Vui lòng chọn loại ghế');
      return;
    }
    if (!formTimeFrame) {
      alert('Vui lòng chọn khung giờ');
      return;
    }

    const body = {
      cinemaTypeId: formCinemaTypeId,
      screenRoomTypeId: formScreenTypeId,
      seatTypeId: formSeatTypeId,
      timeFrame: formTimeFrame,
      // Backend: "SpecialDay" => specialDay = true, khác => false
      dayType: formDayType === 'special' ? 'SpecialDay' : 'NormalDay',
    };

    setIsSaving(true);
    try {
      let res: Response;
      if (isCreating) {
        res = await fetch(PRICE_ADMIN_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(body),
        });
      } else if (editingPrice) {
        res = await fetch(`${PRICE_ADMIN_API}/${editingPrice.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(body),
        });
      } else {
        throw new Error('Không xác định bản ghi cần sửa');
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.result) {
        throw new Error(
          data?.message ||
            (isCreating ? 'Tạo giá vé thất bại' : 'Cập nhật giá vé thất bại'),
        );
      }

      await reloadPrices();
      closeModal();
    } catch (error: any) {
      console.error('Save ticket price error: ', error);
      alert(error.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  // ====== AUTO-GENERATE LOGIC ======

  // Tập key (cinemaName|screenName|seatName|timeFrame|normal/special) của các bản ghi đã tồn tại
  const buildExistingKeys = useCallback(() => {
    const set = new Set<string>();
    prices.forEach((p) => {
      const dt: DayTypeFormValue =
        p.dayType === 'Ngày lễ, cuối tuần' ? 'special' : 'normal';
      const key = `${p.cinemaType}|${p.screenRoomType}|${p.seatType}|${p.timeFrame}|${dt}`;
      set.add(key);
    });
    return set;
  }, [prices]);

  const recomputeAutoCandidates = useCallback(() => {
    if (!cinemaTypes.length || !screenTypes.length || !seatTypes.length) {
      setAutoCandidates([]);
      setAutoSummary(null);
      return;
    }

    setAutoGenerating(true);

    const existing = buildExistingKeys();
    const list: AutoCandidate[] = [];
    const timeFrames: TimeFrameValue[] = [
      'Morning',
      'Noon',
      'Afternoon',
      'Evening',
    ];
    const dayTypes: DayTypeFormValue[] = ['normal', 'special'];

    timeFrames.forEach((tf) => {
      if (!autoTimeFrames[tf]) return;

      dayTypes.forEach((dt) => {
        if (dt === 'normal' && !autoIncludeNormalDay) return;
        if (dt === 'special' && !autoIncludeSpecialDay) return;

        cinemaTypes.forEach((cinema) => {
          screenTypes.forEach((screen) => {
            seatTypes.forEach((seat) => {
              const key = `${cinema.name}|${screen.name}|${seat.name}|${tf}|${dt}`;
              list.push({
                key,
                cinemaType: cinema,
                screenType: screen,
                seatType: seat,
                timeFrame: tf,
                dayType: dt,
                exists: existing.has(key),
              });
            });
          });
        });
      });
    });

    const existed = list.filter((c) => c.exists).length;
    const toCreate = list.length - existed;

    setAutoCandidates(list);
    setAutoSummary({
      total: list.length,
      existed,
      toCreate,
    });
    setAutoGenerating(false);
  }, [
    cinemaTypes,
    screenTypes,
    seatTypes,
    buildExistingKeys,
    autoTimeFrames,
    autoIncludeNormalDay,
    autoIncludeSpecialDay,
  ]);

  useEffect(() => {
    if (isAutoModalOpen) {
      recomputeAutoCandidates();
    }
  }, [isAutoModalOpen, recomputeAutoCandidates]);

  const handleAutoSave = async () => {
    const toCreate = autoCandidates.filter((c) => !c.exists);
    if (!toCreate.length) {
      alert('Không có cấu hình mới cần tạo.');
      return;
    }

    setAutoSaving(true);
    let success = 0;
    let failed = 0;

    try {
      for (const c of toCreate) {
        const body = {
          cinemaTypeId: c.cinemaType.id,
          screenRoomTypeId: c.screenType.id,
          seatTypeId: c.seatType.id,
          timeFrame: c.timeFrame,
          dayType: c.dayType === 'special' ? 'SpecialDay' : 'NormalDay',
        };

        const res = await fetch(PRICE_ADMIN_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          success += 1;
        } else {
          failed += 1;
        }
      }

      setAutoSummary((prev) =>
        prev
          ? { ...prev, success, failed }
          : {
              total: toCreate.length,
              existed: 0,
              toCreate: toCreate.length,
              success,
              failed,
            },
      );
      await reloadPrices();
    } catch (error) {
      console.error('Auto create ticket prices error: ', error);
      alert('Có lỗi khi tự động tạo giá vé.');
    } finally {
      setAutoSaving(false);
    }
  };

  const newAutoCandidatesPreview = useMemo(
    () => autoCandidates.filter((c) => !c.exists).slice(0, 20),
    [autoCandidates],
  );

  // ====== RENDER ======
  return (
    <div className="w-full max-w-5xl mx-auto mt-8">
      {/* Thanh trên: search + filter + nút thêm + auto-generate */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-2 w-full sm:w-80 border rounded-lg px-3 py-2 bg-white">
          <Search size={18} className="text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo loại rạp / phòng / ghế / khung giờ..."
            className="w-full outline-none text-sm"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <Filter size={16} className="text-slate-500" />
          <select
            className="border rounded-lg px-2 py-1 bg-white"
            value={filterCinemaType}
            onChange={(e) => setFilterCinemaType(e.target.value)}
          >
            <option value="All">Tất cả loại rạp</option>
            {cinemaTypes.map((ct) => (
              <option key={ct.id} value={ct.name}>
                {ct.name}
              </option>
            ))}
          </select>

          <select
            className="border rounded-lg px-2 py-1 bg-white"
            value={filterScreenType}
            onChange={(e) => setFilterScreenType(e.target.value)}
          >
            <option value="All">Tất cả loại phòng</option>
            {screenTypes.map((st) => (
              <option key={st.id} value={st.name}>
                {st.name}
              </option>
            ))}
          </select>

          <select
            className="border rounded-lg px-2 py-1 bg-white"
            value={filterSeatType}
            onChange={(e) => setFilterSeatType(e.target.value)}
          >
            <option value="All">Tất cả loại ghế</option>
            {seatTypes.map((st) => (
              <option key={st.id} value={st.name}>
                {st.name}
              </option>
            ))}
          </select>

          <select
            className="border rounded-lg px-2 py-1 bg-white"
            value={filterTimeFrame}
            onChange={(e) => setFilterTimeFrame(e.target.value)}
          >
            <option value="All">Mọi khung giờ</option>
            <option value="Morning">Morning</option>
            <option value="Noon">Noon</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
          </select>

          <select
            className="border rounded-lg px-2 py-1 bg-white"
            value={filterDayType}
            onChange={(e) =>
              setFilterDayType(
                e.target.value as 'All' | 'Normal' | 'Special',
              )
            }
          >
            <option value="All">Mọi ngày</option>
            <option value="Normal">Ngày thường</option>
            <option value="Special">Ngày lễ / cuối tuần</option>
          </select>
        </div>

        <div className="flex gap-2 self-start">
          <button
            type="button"
            onClick={() => setIsAutoModalOpen(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm hover:bg-slate-100 transition-colors"
          >
            <Plus size={16} />
            Tự động tạo
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#0c46d6] text-white text-sm hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} />
            Thêm giá vé
          </button>
        </div>
      </div>

      {/* Bảng danh sách giá vé */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <span>Danh sách giá vé</span>
            {loadingList && <Loader2 className="animate-spin" size={16} />}
          </div>
          <p className="text-xs text-slate-500">
            Giá được backend tính tự động theo hệ số loại rạp / phòng / ghế, khung
            giờ và loại ngày.
          </p>
        </div>

        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left w-12">#</th>
                <th className="px-4 py-2 text-left">Loại rạp</th>
                <th className="px-4 py-2 text-left">Loại phòng</th>
                <th className="px-4 py-2 text-left">Loại ghế</th>
                <th className="px-4 py-2 text-left">Khung giờ</th>
                <th className="px-4 py-2 text-left">Ngày</th>
                <th className="px-4 py-2 text-right">Giá (VND)</th>
                <th className="px-4 py-2 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPrices.length === 0 && !loadingList && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-slate-500 text-sm"
                  >
                    Chưa có cấu hình giá vé nào.
                  </td>
                </tr>
              )}

              {paginatedPrices.map((p, index) => (
                <tr
                  key={p.id}
                  className="border-t last:border-b hover:bg-slate-50/60"
                >
                  <td className="px-4 py-2 text-slate-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-4 py-2 text-slate-700">{p.cinemaType}</td>
                  <td className="px-4 py-2 text-slate-700">
                    {p.screenRoomType}
                  </td>
                  <td className="px-4 py-2 text-slate-700">{p.seatType}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-slate-100 text-slate-700 border border-slate-200">
                      {p.timeFrame}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${
                        p.dayType === 'Ngày lễ, cuối tuần'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}
                    >
                      {p.dayType}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-slate-800">
                    {p.price.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                      onClick={() => openEditModal(p)}
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t flex items-center justify-between text-xs text-slate-600">
          <span>
            Trang {currentPage} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 rounded border bg-white disabled:opacity-40"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev))
              }
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="p-1 rounded border bg-white disabled:opacity-40"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) =>
                  prev < totalPages ? prev + 1 : prev,
                )
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal tạo / sửa giá vé (1 bản ghi) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">
                {isCreating ? 'Thêm giá vé' : 'Chỉnh sửa giá vé'}
              </h3>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-slate-100"
                onClick={closeModal}
                disabled={isSaving}
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-4 py-3 space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Loại rạp
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                    value={formCinemaTypeId}
                    onChange={(e) =>
                      setFormCinemaTypeId(
                        e.target.value ? Number(e.target.value) : '',
                      )
                    }
                  >
                    <option value="">Chọn loại rạp</option>
                    {cinemaTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Loại phòng chiếu
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                    value={formScreenTypeId}
                    onChange={(e) =>
                      setFormScreenTypeId(
                        e.target.value ? Number(e.target.value) : '',
                      )
                    }
                  >
                    <option value="">Chọn loại phòng chiếu</option>
                    {screenTypes.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Loại ghế
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                    value={formSeatTypeId}
                    onChange={(e) =>
                      setFormSeatTypeId(
                        e.target.value ? Number(e.target.value) : '',
                      )
                    }
                  >
                    <option value="">Chọn loại ghế</option>
                    {seatTypes.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Khung giờ
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                    value={formTimeFrame}
                    onChange={(e) =>
                      setFormTimeFrame(e.target.value as TimeFrameFormValue)
                    }
                  >
                    <option value="">Chọn khung giờ</option>
                    <option value="Morning">Morning (08:00 - 11:59)</option>
                    <option value="Noon">Noon (12:00 - 16:59)</option>
                    <option value="Afternoon">
                      Afternoon (17:00 - 22:59)
                    </option>
                    <option value="Evening">
                      Evening (23:00 - 02:59)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Loại ngày
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                    value={formDayType}
                    onChange={(e) =>
                      setFormDayType(e.target.value as DayTypeFormValue)
                    }
                  >
                    <option value="normal">Ngày thường</option>
                    <option value="special">Ngày lễ / cuối tuần</option>
                  </select>
                </div>

                <div className="text-xs text-slate-500 flex items-center">
                  Giá vé sẽ được backend tính tự động theo hệ số loại rạp, phòng
                  chiếu, ghế, khung giờ và loại ngày.&nbsp;
                  Bạn không cần nhập giá trực tiếp.
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={closeModal}
                disabled={isSaving}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg bg-[#0c46d6] text-white hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="animate-spin" size={16} />}
                {isCreating ? 'Tạo mới' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal AUTO-GENERATE giá vé */}
      {isAutoModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">Tự động sinh giá vé</h3>
              <button
                type="button"
                className="p-1 rounded-full hover:bg-slate-100"
                onClick={() => setIsAutoModalOpen(false)}
                disabled={autoSaving}
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-4 py-3 space-y-4 text-sm overflow-y-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-slate-600">
                    Hệ thống sẽ sinh tất cả tổ hợp theo:&nbsp;
                    <b>
                      Loại rạp × Loại phòng × Loại ghế × Khung giờ × Loại ngày
                    </b>
                    . Chỉ những tổ hợp chưa có trong bảng giá hiện tại mới được tạo.
                  </p>

                  <div className="border rounded-lg p-3 space-y-3">
                    <p className="text-xs font-medium text-slate-700">
                      Chọn khung giờ
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {(
                        ['Morning', 'Noon', 'Afternoon', 'Evening'] as TimeFrameValue[]
                      ).map((tf) => (
                        <label
                          key={tf}
                          className="inline-flex items-center gap-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-slate-300"
                            checked={autoTimeFrames[tf]}
                            onChange={(e) =>
                              setAutoTimeFrames((prev) => ({
                                ...prev,
                                [tf]: e.target.checked,
                              }))
                            }
                          />
                          <span>
                            {tf === 'Morning' && 'Morning (08:00 - 11:59)'}
                            {tf === 'Noon' && 'Noon (12:00 - 16:59)'}
                            {tf === 'Afternoon' && 'Afternoon (17:00 - 22:59)'}
                            {tf === 'Evening' && 'Evening (23:00 - 02:59)'}
                          </span>
                        </label>
                      ))}
                    </div>

                    <p className="text-xs font-medium text-slate-700 mt-2">
                      Chọn loại ngày
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300"
                          checked={autoIncludeNormalDay}
                          onChange={(e) =>
                            setAutoIncludeNormalDay(e.target.checked)
                          }
                        />
                        <span>Ngày thường</span>
                      </label>
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300"
                          checked={autoIncludeSpecialDay}
                          onChange={(e) =>
                            setAutoIncludeSpecialDay(e.target.checked)
                          }
                        />
                        <span>Ngày lễ / cuối tuần</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      className="mt-3 px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      onClick={recomputeAutoCandidates}
                      disabled={autoGenerating || loadingOptions}
                    >
                      {autoGenerating && (
                        <Loader2 className="animate-spin" size={14} />
                      )}
                      Tính lại các tổ hợp
                    </button>
                  </div>
                </div>

                <div className="w-full sm:w-60 border rounded-lg p-3 bg-slate-50 space-y-2 text-xs">
                  <p className="font-medium text-slate-700 mb-1">Tóm tắt</p>
                  {autoSummary ? (
                    <>
                      <p>
                        Tổng tổ hợp có thể:{' '}
                        <b>{autoSummary.total.toLocaleString('vi-VN')}</b>
                      </p>
                      <p>
                        Đã tồn tại:{' '}
                        <b>{autoSummary.existed.toLocaleString('vi-VN')}</b>
                      </p>
                      <p>
                        Sẽ tạo mới:{' '}
                        <b className="text-emerald-700">
                          {autoSummary.toCreate.toLocaleString('vi-VN')}
                        </b>
                      </p>

                      {typeof autoSummary.success === 'number' && (
                        <>
                          <p className="mt-1">
                            Tạo thành công:{' '}
                            <b className="text-emerald-700">
                              {autoSummary.success.toLocaleString('vi-VN')}
                            </b>
                          </p>
                          <p>
                            Tạo thất bại:{' '}
                            <b className="text-rose-700">
                              {autoSummary.failed?.toLocaleString('vi-VN')}
                            </b>
                          </p>
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-500">
                      Chưa có dữ liệu. Kiểm tra lại danh sách loại rạp / phòng / ghế.
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-slate-500">
                    Lưu ý: Số lượng tổ hợp có thể khá lớn nếu bạn có nhiều loại rạp /
                    phòng / ghế. Hệ thống chỉ gọi API tạo cho các tổ hợp chưa tồn tại
                    nên sẽ không bị trùng dữ liệu.
                  </p>
                </div>
              </div>

              <div className="border rounded-lg">
                <div className="px-3 py-2 border-b flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-700">
                    Xem trước một số tổ hợp mới sẽ tạo
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Hiển thị tối đa 20 dòng mẫu
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-1 text-left">Loại rạp</th>
                        <th className="px-3 py-1 text-left">Loại phòng</th>
                        <th className="px-3 py-1 text-left">Loại ghế</th>
                        <th className="px-3 py-1 text-left">Khung giờ</th>
                        <th className="px-3 py-1 text-left">Ngày</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newAutoCandidatesPreview.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-3 text-center text-slate-500"
                          >
                            Không có tổ hợp mới nào (hoặc bạn đã có đủ giá vé).
                          </td>
                        </tr>
                      )}

                      {newAutoCandidatesPreview.map((c) => (
                        <tr key={c.key} className="border-t">
                          <td className="px-3 py-1">{c.cinemaType.name}</td>
                          <td className="px-3 py-1">{c.screenType.name}</td>
                          <td className="px-3 py-1">{c.seatType.name}</td>
                          <td className="px-3 py-1">{c.timeFrame}</td>
                          <td className="px-3 py-1">
                            {c.dayType === 'special'
                              ? 'Ngày lễ, cuối tuần'
                              : 'Ngày thường'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t flex justify-end gap-2 text-sm">
              <button
                type="button"
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={() => setIsAutoModalOpen(false)}
                disabled={autoSaving}
              >
                Đóng
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-lg bg-[#0c46d6] text-white hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60"
                onClick={handleAutoSave}
                disabled={
                  autoSaving || !autoSummary || autoSummary.toCreate === 0
                }
              >
                {autoSaving && <Loader2 className="animate-spin" size={16} />}
                Tạo tất cả giá vé còn thiếu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
