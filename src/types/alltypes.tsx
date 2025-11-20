export interface TypeMovie {
  id: number;
  name: string;
  posterUrl: string;
  category: string;
  releaseDate: string;
  duration: number;
}

export interface TypeCinema{
  id:number
  name: string
  address: string
  status: string
}

export interface UserType{
  id:number
  email:string
  name:string
  phone: string
  roleName:string
  birthday: string
  status: string
}

export interface Movie {
  id: number;
  name: string;
  posterUrl: string;
  yearRelease: number;
  category: string;
  showSchedule: string;
  status: string;
  creatAt: string;
}

// Rạp chiếu
export interface TypeCinema {
  id: number;
  name: string;
  address: string;
  status: string;      // 'ACTIVE' | 'INACTIVE' nếu muốn stricter
  cinemaType?: string; // thêm field này để chứa tên loại rạp (2D, 3D, IMAX,...)
}

// Loại rạp (CinemaType)
export interface TypeCinemaType {
  id: number;
  name: string;
}

// Tỉnh / Thành phố (API provinces.open-api.vn)
export interface Province {
  code: number;
  name: string; // "Thành phố Hà Nội", "Tỉnh Bắc Ninh", ...
}

export interface CinemaSummary {
  id: number;
  name: string;
}

export interface ScreenRoomType {
  id: number;
  name: string;
  priceFactor: number;
}

// Phòng chiếu (dùng detail response cho list)
export interface ScreenRoomDetail {
  id: number;
  name: string;
  roomType: string;
  status: string;
}

export interface MovieShowDay {
  id: number;
  name: string;
}

export interface ShowTimeDTO {
  id: number;
  movieName: string;
  showDate: string;
  startTime: string;
  endTime: string;
  screenRoomId: number;
}

export interface ShowTimeResponse {
  id: number;
  showDate: string;
  startTime: string;
  endTime: string;
  screenRoomId: number;
  movieId: number;
  movieName?: string;
}

export interface TicketPrice {
  id: number;
  timeFrame: string;      // "Morning" | "Noon" | "Afternoon" | "Evening"
  dayType: string;        // "Ngày lễ, cuối tuần" | "Ngày thường" (BE trả sẵn)
  cinemaType: string;     // tên loại rạp
  screenRoomType: string; // tên loại phòng chiếu
  seatType: string;       // tên loại ghế
  price: number;          // BigDecimal từ BE convert sang number
}

export interface SeatType {
  id: number;
  name: string;
  priceFactor: number;
}

 export interface TypeCinemaType {
  id: number;
  name: string;
}

type TabKey = 'overview' | 'movie' | 'cinema';

interface RevenueDashboard {
  todayTicket: number;
  todayRevenue: number;
  monthRevenue: number;
  monthTicket: number;
}

interface StatisticSummary {
  month: number;       // 1..12
  monthTicket: number;
  monthRevenue: number;
}

interface MovieRevenue {
  movieName: string;
  totalTicket: number;
  totalRevenue: number;
}

interface CinemaRevenue {
  cinemaName: string;
  totalTicket: number;
  totalRevenue: number;
}