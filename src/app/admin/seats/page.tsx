'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  MapPin,
  Building,
  MonitorPlay,
  Armchair,
  Eraser,
} from 'lucide-react';

import {
  Province,
  CinemaSummary,
  ScreenRoomDetail,
} from '@/types/alltypes';

// ====== CONST API ======
const BASE_API = 'http://localhost:8080/api';
const PROVINCES_API = 'https://provinces.open-api.vn/api/v2/p/';
const CINEMA_BY_ADDRESS_API = `${BASE_API}/cinema/address`;
const SCREENROOM_ADMIN_API = `${BASE_API}/admin/screenRoom`;
const SEAT_ADMIN_API = `${BASE_API}/admin/seat`;
const SEAT_TYPE_ADMIN_API = `${BASE_API}/admin/seatType`;

// ====== Kiểu dữ liệu cục bộ ======
interface SeatType {
  id: number;
  name: string;
  priceFactor: number;
}

interface SeatSummary {
  id: number;
  seatTypeName: string;
  seatTypeId: number;
  seatCode: string; // "A1", "B10", ...
}

// Lấy Authorization header từ localStorage (giữ giống các màn admin khác)
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export default function AdminSeatsPage() {
  // ====== STATE chọn địa điểm & phòng ======
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cinemas, setCinemas] = useState<CinemaSummary[]>([]);
  const [screenRooms, setScreenRooms] = useState<ScreenRoomDetail[]>([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('');
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | null>(null);
  const [selectedScreenRoomId, setSelectedScreenRoomId] = useState<number | null>(null);

  // ====== STATE loại ghế & layout ======
  const [seatTypes, setSeatTypes] = useState<SeatType[]>([]);
  const [selectedSeatTypeId, setSelectedSeatTypeId] = useState<number | null>(null); // null = Không có ghế / lối đi

  const [rowsInput, setRowsInput] = useState<number>(8);
  const [colsInput, setColsInput] = useState<number>(12);
  const [rows, setRows] = useState<number>(0);
  const [cols, setCols] = useState<number>(0);

  // matrix[row][col] = seatTypeId | null
  const [seatMatrix, setSeatMatrix] = useState<(number | null)[][]>([]);

  const [hasExistingLayout, setHasExistingLayout] = useState<boolean>(false);

  // ====== Loading & message ======
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCinemas, setLoadingCinemas] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingSeatTypes, setLoadingSeatTypes] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ====== FETCH PROVINCES ======
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch(PROVINCES_API);
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: Province[] = data.map((p: any) => ({
            code: p.code,
            name: p.name,
          }));
          setProvinces(mapped);
        }
      } catch (error) {
        console.error('Fetch provinces failed:', error);
        setErrorMessage('Không tải được danh sách tỉnh / thành.');
    } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  // ====== FETCH SEAT TYPES ======
  useEffect(() => {
    const fetchSeatTypes = async () => {
      setLoadingSeatTypes(true);
      try {
        const res = await fetch(SEAT_TYPE_ADMIN_API, {
          headers: {
            ...getAuthHeaders(),
          },
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.result)) {
          const list: SeatType[] = data.result.map((t: any) => ({
            id: t.id,
            name: t.name,
            priceFactor: t.priceFactor,
          }));
          setSeatTypes(list);
          if (list.length > 0) {
            setSelectedSeatTypeId(list[0].id);
          }
        } else {
          setErrorMessage(data?.message || 'Không tải được loại ghế.');
        }
      } catch (error) {
        console.error('Fetch seat types failed:', error);
        setErrorMessage('Không tải được loại ghế.');
      } finally {
        setLoadingSeatTypes(false);
      }
    };

    fetchSeatTypes();
  }, []);

  // ====== Helper reset layout ======
  const resetLayout = () => {
    setHasExistingLayout(false);
    setRows(0);
    setCols(0);
    setSeatMatrix([]);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // ====== FETCH CINEMAS THEO TỈNH ======
  const handleProvinceChange = async (code: string) => {
    setSelectedProvinceCode(code);
    setSelectedCinemaId(null);
    setSelectedScreenRoomId(null);
    setCinemas([]);
    setScreenRooms([]);
    resetLayout();

    if (!code) return;

    const province = provinces.find((p) => String(p.code) === code);
    if (!province) return;

    setLoadingCinemas(true);
    try {
      const res = await fetch(CINEMA_BY_ADDRESS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: province.name }),
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.result)) {
        const list: CinemaSummary[] = data.result.map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
        setCinemas(list);
      } else {
        setErrorMessage(data?.message || 'Không tải được danh sách rạp.');
      }
    } catch (error) {
      console.error('Fetch cinemas failed:', error);
      setErrorMessage('Không tải được danh sách rạp.');
    } finally {
      setLoadingCinemas(false);
    }
  };

  // ====== FETCH SCREEN ROOMS THEO RẠP ======
  const handleCinemaChange = async (cinemaIdStr: string) => {
    const id = cinemaIdStr ? Number(cinemaIdStr) : NaN;
    if (Number.isNaN(id)) {
      setSelectedCinemaId(null);
      setScreenRooms([]);
      setSelectedScreenRoomId(null);
      resetLayout();
      return;
    }

    setSelectedCinemaId(id);
    setSelectedScreenRoomId(null);
    setScreenRooms([]);
    resetLayout();

    setLoadingRooms(true);
    try {
      const res = await fetch(`${SCREENROOM_ADMIN_API}/cinema/${id}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.result)) {
        const list: ScreenRoomDetail[] = data.result.map((sr: any) => ({
          id: sr.id,
          name: sr.name,
          roomType: sr.roomType,
        }));
        setScreenRooms(list);
      } else {
        setErrorMessage(data?.message || 'Không tải được danh sách phòng chiếu.');
      }
    } catch (error) {
      console.error('Fetch screen rooms failed:', error);
      setErrorMessage('Không tải được danh sách phòng chiếu.');
    } finally {
      setLoadingRooms(false);
    }
  };

  // ====== FETCH LAYOUT GHẾ THEO PHÒNG CHIẾU ======
  const handleScreenRoomChange = async (screenRoomIdStr: string) => {
    const id = screenRoomIdStr ? Number(screenRoomIdStr) : NaN;
    if (Number.isNaN(id)) {
      setSelectedScreenRoomId(null);
      resetLayout();
      return;
    }

    setSelectedScreenRoomId(id);
    resetLayout();
    setLoadingSeats(true);

    try {
      const res = await fetch(`${SEAT_ADMIN_API}/screenroom/${id}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.message || 'Không lấy được danh sách ghế.');
        return;
      }

      const list: SeatSummary[] = Array.isArray(data.result) ? data.result : [];

      // ======= TRƯỜNG HỢP CHƯA CÓ GHẾ =======
      if (list.length === 0) {
        setHasExistingLayout(false);
        setRows(0);
        setCols(0);
        setSeatMatrix([]);
        setSuccessMessage('Phòng chưa có sơ đồ ghế. Hãy nhập số hàng / cột để tạo mới.');
        return;
      }

      // ======= TRƯỜNG HỢP ĐÃ CÓ GHẾ -> DỰNG LẠI MA TRẬN TỪ seatCode =======
      let maxRow = 0;
      let maxCol = 0;
      const parsedSeats: { rowIdx: number; colIdx: number; seatTypeId: number }[] = [];

      for (const seat of list) {
        if (!seat.seatCode || typeof seat.seatCode !== 'string') continue;
        const code = seat.seatCode.toUpperCase();

        const rowChar = code.charAt(0);
        const rowIdx = rowChar.charCodeAt(0) - 'A'.charCodeAt(0);
        const colStr = code.slice(1);
        const colIdx = Number.parseInt(colStr, 10) - 1;

        if (Number.isNaN(rowIdx) || rowIdx < 0 || Number.isNaN(colIdx) || colIdx < 0) continue;

        maxRow = Math.max(maxRow, rowIdx);
        maxCol = Math.max(maxCol, colIdx);

        parsedSeats.push({ rowIdx, colIdx, seatTypeId: seat.seatTypeId });
      }

      const rowsCount = maxRow + 1;
      const colsCount = maxCol + 1;

      const matrix: (number | null)[][] = Array.from({ length: rowsCount }, () =>
        Array.from({ length: colsCount }, () => null),
      );

      for (const seat of parsedSeats) {
        if (
          seat.rowIdx >= 0 &&
          seat.rowIdx < rowsCount &&
          seat.colIdx >= 0 &&
          seat.colIdx < colsCount
        ) {
          matrix[seat.rowIdx][seat.colIdx] = seat.seatTypeId;
        }
      }

      setHasExistingLayout(true);
      setRows(rowsCount);
      setCols(colsCount);
      setRowsInput(rowsCount);
      setColsInput(colsCount);
      setSeatMatrix(matrix);
      setSuccessMessage('Sơ đồ ghế hiện tại.');
    } catch (error) {
      console.error('Fetch seats failed:', error);
      setErrorMessage('Không lấy được danh sách ghế.');
    } finally {
      setLoadingSeats(false);
    }
  };

  // ====== Áp dụng số hàng / cột để tạo sơ đồ trống ======
  const handleApplyDimension = () => {
    if (!selectedScreenRoomId) {
      setErrorMessage('Hãy chọn phòng chiếu trước khi tạo sơ đồ ghế.');
      return;
    }

    if (hasExistingLayout) {
      setErrorMessage('Phòng này đã có sơ đồ ghế. Hiện tại chỉ cho phép xem, chưa hỗ trợ tạo lại.');
      return;
    }

    let r = Number(rowsInput);
    let c = Number(colsInput);
    if (Number.isNaN(r) || Number.isNaN(c)) {
      setErrorMessage('Số hàng / cột không hợp lệ.');
      return;
    }

    // Ràng buộc theo @Min / @Max của backend
    r = Math.min(26, Math.max(2, r));
    c = Math.min(26, Math.max(2, c));

    const matrix: (number | null)[][] = Array.from({ length: r }, () =>
      Array.from({ length: c }, () => selectedSeatTypeId ?? null),
    );

    setRows(r);
    setCols(c);
    setSeatMatrix(matrix);
    setErrorMessage(null);
    setSuccessMessage('Đã tạo sơ đồ trống. Click vào từng ghế để đổi loại ghế / lối đi.');
  };

  // ====== Click ghế để set loại ghế ======
  const handleClickSeat = (rowIdx: number, colIdx: number) => {
    if (hasExistingLayout) {
      // Layout đã tồn tại -> chỉ xem, không sửa
      return;
    }

    setSeatMatrix((prev) =>
      prev.map((row, r) =>
        row.map((cell, c) => {
          if (r === rowIdx && c === colIdx) {
            return selectedSeatTypeId; // có thể = null => lối đi
          }
          return cell;
        }),
      ),
    );
  };

  // ====== Lưu layout lên backend ======
  const handleSaveLayout = async () => {
    if (!selectedScreenRoomId) {
      setErrorMessage('Hãy chọn phòng chiếu.');
      return;
    }
    if (hasExistingLayout) {
      setErrorMessage('Phòng này đã có sơ đồ ghế. Hiện tại BE chưa hỗ trợ cập nhật lại sơ đồ.');
      return;
    }
    if (!rows || !cols || seatMatrix.length === 0) {
      setErrorMessage('Hãy tạo sơ đồ ghế trước khi lưu.');
      return;
    }

    setSavingLayout(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      screen_room_id: selectedScreenRoomId,
      rows,
      columns: cols,
      seatTypeIds: seatMatrix,
    };

    try {
      const res = await fetch(`${SEAT_ADMIN_API}/layout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.code && data.code !== 0)) {
        throw new Error(data?.message || 'Lưu sơ đồ ghế thất bại.');
      }

      setSuccessMessage('Lưu sơ đồ ghế thành công.');

      // ✅ Sau khi lưu xong, gọi lại GET /admin/seat/screenroom/{screenRoomId}
      // để đảm bảo FE hiển thị đúng dữ liệu BE vừa tạo
      if (selectedScreenRoomId) {
        await handleScreenRoomChange(String(selectedScreenRoomId));
      }
    } catch (error: any) {
      console.error('Save layout failed:', error);
      setErrorMessage(error.message || 'Lưu sơ đồ ghế thất bại.');
    } finally {
      setSavingLayout(false);
    }
  };

  // ====== UI Helper: màu ghế theo seatType ======
  const seatTypeColorMap = useMemo(
    () => [
      'bg-emerald-500 text-white',
      'bg-sky-500 text-white',
      'bg-amber-500 text-white',
      'bg-rose-500 text-white',
      'bg-violet-500 text-white',
      'bg-indigo-500 text-white',
    ],
    [],
  );

  const getSeatColorClass = (seatTypeId: number | null): string => {
    if (!seatTypeId) {
      return 'bg-slate-200 text-slate-400';
    }
    const idx = seatTypes.findIndex((t) => t.id === seatTypeId);
    if (idx === -1) return 'bg-slate-400 text-white';
    return seatTypeColorMap[idx % seatTypeColorMap.length];
  };

  const getRowLabel = (idx: number) => String.fromCharCode('A'.charCodeAt(0) + idx);

  // ====== RENDER ======
  return (
    <div className="flex-1 flex justify-center items-start">
      <div className="w-full max-w-6xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Quản lý ghế phòng chiếu
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Chọn rạp & phòng chiếu rồi thiết kế sơ đồ ghế. Sơ đồ đã tạo sẽ hiển thị lại đúng với logic backend.
            </p>
          </div>
        </div>

        {/* Thông báo lỗi / thành công */}
        {(errorMessage || successMessage) && (
          <div className="space-y-2">
            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Cột trái: chọn địa điểm, rạp, phòng, loại ghế */}
          <div className="col-span-12 md:col-span-4 space-y-4">
            {/* Chọn tỉnh / thành */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-800">
                <MapPin size={18} />
                <span className="font-medium text-sm">Chọn Tỉnh / Thành phố</span>
              </div>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                value={selectedProvinceCode}
                onChange={(e) => handleProvinceChange(e.target.value)}
              >
                <option value="">-- Chọn tỉnh / thành --</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
              {loadingProvinces && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="animate-spin" size={14} />
                  Đang tải danh sách tỉnh / thành...
                </div>
              )}
            </div>

            {/* Chọn rạp */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-800">
                <Building size={18} />
                <span className="font-medium text-sm">Chọn rạp</span>
              </div>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                value={selectedCinemaId ?? ''}
                onChange={(e) => handleCinemaChange(e.target.value)}
                disabled={!selectedProvinceCode}
              >
                <option value="">-- Chọn rạp --</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {loadingCinemas && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="animate-spin" size={14} />
                  Đang tải danh sách rạp...
                </div>
              )}
            </div>

            {/* Chọn phòng chiếu */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-800">
                <MonitorPlay size={18} />
                <span className="font-medium text-sm">Chọn phòng chiếu</span>
              </div>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                value={selectedScreenRoomId ?? ''}
                onChange={(e) => handleScreenRoomChange(e.target.value)}
                disabled={!selectedCinemaId}
              >
                <option value="">-- Chọn phòng chiếu --</option>
                {screenRooms.map((sr) => (
                  <option key={sr.id} value={sr.id}>
                    {sr.name} ({sr.roomType})
                  </option>
                ))}
              </select>
              {loadingRooms && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="animate-spin" size={14} />
                  Đang tải danh sách phòng chiếu...
                </div>
              )}
            </div>

            {/* Loại ghế & tool "Không có ghế" */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800">
                  <Armchair size={18} />
                  <span className="font-medium text-sm">Loại ghế</span>
                </div>
                {loadingSeatTypes && (
                  <Loader2 className="animate-spin" size={16} />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Tool lối đi / không có ghế */}
                <button
                  type="button"
                  onClick={() => setSelectedSeatTypeId(null)}
                  className={[
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs',
                    selectedSeatTypeId === null
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400',
                  ].join(' ')}
                  disabled={hasExistingLayout}
                >
                  <Eraser size={14} />
                  Không có ghế / Lối đi
                </button>

                {seatTypes.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedSeatTypeId(st.id)}
                    className={[
                      'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition',
                      selectedSeatTypeId === st.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400',
                    ].join(' ')}
                    disabled={hasExistingLayout}
                  >
                    <span
                      className={[
                        'inline-block h-3 w-3 rounded-full',
                        getSeatColorClass(st.id).split(' ')[0], // chỉ lấy bg-xxx
                      ].join(' ')}
                    />
                    <span>{st.name}</span>
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-500">
                Chọn loại ghế rồi click vào ô trong sơ đồ để vẽ. Chọn “Không có ghế / Lối đi” để tạo khoảng trống.
              </p>
            </div>

            {/* Thiết lập số hàng / cột */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-800">
                <Armchair size={18} />
                <span className="font-medium text-sm">Kích thước sơ đồ ghế</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Số hàng (2 - 26)</label>
                  <input
                    type="number"
                    min={2}
                    max={26}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                    value={rowsInput}
                    onChange={(e) => setRowsInput(Number(e.target.value))}
                    disabled={hasExistingLayout || !selectedScreenRoomId}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Số cột (2 - 26)</label>
                  <input
                    type="number"
                    min={2}
                    max={26}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                    value={colsInput}
                    onChange={(e) => setColsInput(Number(e.target.value))}
                    disabled={hasExistingLayout || !selectedScreenRoomId}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyDimension}
                disabled={hasExistingLayout || !selectedScreenRoomId}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-sm disabled:opacity-60"
              >
                Tạo sơ đồ trống
              </button>

              {hasExistingLayout && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Phòng đã có sơ đồ ghế. Hiện tại chỉ cho phép xem, chưa hỗ trợ chỉnh sửa / tạo lại từ frontend.
                </p>
              )}
            </div>

            {/* Nút lưu */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <button
                type="button"
                onClick={handleSaveLayout}
                disabled={
                  savingLayout ||
                  hasExistingLayout ||
                  !selectedScreenRoomId ||
                  seatMatrix.length === 0
                }
                className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingLayout && <Loader2 className="mr-2 animate-spin" size={16} />}
                Lưu sơ đồ ghế
              </button>
              <p className="text-[11px] text-slate-500">
                Sau khi lưu, sơ đồ sẽ được dùng cho đặt vé. Hiện tại chỉ hỗ trợ tạo mới nếu phòng chưa có ghế.
              </p>
            </div>
          </div>

          {/* Cột phải: sơ đồ ghế đẹp */}
          <div className="col-span-12 md:col-span-8">
            <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">
                    Sơ đồ ghế
                  </span>
                  {loadingSeats && <Loader2 className="animate-spin" size={16} />}
                </div>

                {rows > 0 && cols > 0 && (
                  <span className="text-xs text-slate-500">
                    {rows} hàng × {cols} cột
                  </span>
                )}
              </div>

              {/* Màn hình */}
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-2 shadow-md">
                  <span className="text-[11px] font-semibold tracking-[0.25em] text-slate-50 uppercase">
                    Màn hình
                  </span>
                </div>
              </div>

              {/* Nếu chưa có gì */}
              {!rows || !cols || seatMatrix.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-slate-500">
                  <p className="mb-1">
                    Chưa có sơ đồ ghế.
                  </p>
                  <p className="text-xs">
                    Hãy chọn phòng chiếu &amp; nhập số hàng / cột rồi nhấn{' '}
                    <span className="font-semibold">“Tạo sơ đồ trống”</span>.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-3 overflow-auto">
                  {/* Header cột */}
                  <div className="flex ml-10">
                    <div className="w-6" />
                    <div className="flex-1 overflow-x-auto">
                      <div className="inline-flex gap-[6px]">
                        {Array.from({ length: cols }).map((_, c) => (
                          <div
                            key={c}
                            className="w-8 h-6 flex items-center justify-center text-[10px] font-medium text-slate-500"
                          >
                            {c + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Grid ghế */}
                  <div className="flex">
                    {/* Label hàng */}
                    <div className="flex flex-col items-center mr-2">
                      {Array.from({ length: rows }).map((_, r) => (
                        <div
                          key={r}
                          className="w-6 h-8 flex items-center justify-center text-[10px] font-semibold text-slate-500"
                        >
                          {getRowLabel(r)}
                        </div>
                      ))}
                    </div>

                    {/* Ma trận ghế */}
                    <div className="flex-1 overflow-x-auto">
                      <div
                        className="inline-grid gap-[6px]"
                        style={{
                          gridTemplateColumns: `repeat(${cols}, minmax(2rem, 2rem))`,
                        }}
                      >
                        {seatMatrix.map((row, r) =>
                          row.map((cell, c) => (
                            <button
                              key={`${r}-${c}`}
                              type="button"
                              onClick={() => handleClickSeat(r, c)}
                              className={[
                                'w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-semibold shadow-sm transition-transform',
                                getSeatColorClass(cell),
                                hasExistingLayout
                                  ? 'cursor-default'
                                  : 'hover:scale-105 cursor-pointer',
                              ].join(' ')}
                            >
                              {cell ? getRowLabel(r) + (c + 1) : ''}
                            </button>
                          )),
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chú thích màu */}
                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-600">
                    {seatTypes.map((st) => (
                      <div key={st.id} className="inline-flex items-center gap-1">
                        <span
                          className={[
                            'inline-block h-3 w-3 rounded-sm border border-slate-300',
                            getSeatColorClass(st.id),
                          ].join(' ')}
                        />
                        <span>{st.name}</span>
                      </div>
                    ))}
                    <div className="inline-flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded-sm border border-dashed border-slate-300 bg-slate-50" />
                      <span>Lối đi / không có ghế</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
