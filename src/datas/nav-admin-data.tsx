import {
  Armchair,
  Building,
  CalendarDays,
  ChartNoAxesCombined,
  Film,
  PartyPopper,
  ScreenShare,
  User,
  MonitorPlay, // Icon mới cho loại phòng chiếu nhìn hợp hơn
  Sofa, // Icon mới cho loại ghế
} from 'lucide-react';

// Set size mặc định cho icon
const iconSize = 20; 

export const navs = [
  {
    name: 'Thống kê',
    url: '/admin/statistical',
    icon: <ChartNoAxesCombined size={iconSize} />,
  },
  {
    name: 'Quản lý phim',
    url: '/admin/movies',
    icon: <Film size={iconSize} />,
  },
  {
    name: 'Quản lý rạp',
    url: '/admin/cinemas',
    icon: <Building size={iconSize} />,
  },
  {
    name: 'Quản lý phòng chiếu',
    url: '/admin/screens',
    icon: <ScreenShare size={iconSize} />,
  },
  {
    name: 'Loại phòng chiếu',
    url: '/admin/screen-types',
    icon: <MonitorPlay size={iconSize} />,
  },
  {
    name: 'Quản lý ghế',
    url: '/admin/seats',
    icon: <Armchair size={iconSize} />,
  },
  {
    name: 'Loại ghế',
    url: '/admin/seats-types',
    icon: <Sofa size={iconSize} />,
  },
  {
    name: 'Quản lý suất chiếu',
    url: '/admin/showtimes',
    icon: <CalendarDays size={iconSize} />,
  },
  {
    name: 'Quản lý ngày lễ',
    url: '/admin/holidays',
    icon: <PartyPopper size={iconSize} />
  },
  {
    name: 'Quản lý User',
    url: '/admin/users',
    icon: <User size={iconSize} />,
  },
];