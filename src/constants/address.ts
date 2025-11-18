// Định nghĩa Interface để TypeScript hiểu kiểu dữ liệu
export interface ProvinceType {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
  wards: []; // Để mảng rỗng như yêu cầu
}

export const LIST_PROVINCES: ProvinceType[] = [
  {
    "name": "Thành phố Hà Nội",
    "code": 1,
    "division_type": "thành phố trung ương",
    "codename": "ha_noi",
    "phone_code": 24,
    "wards": []
  },
  {
    "name": "Thành phố Hồ Chí Minh",
    "code": 79,
    "division_type": "thành phố trung ương",
    "codename": "ho_chi_minh",
    "phone_code": 28,
    "wards": []
  },
  {
    "name": "Thành phố Hải Phòng",
    "code": 31,
    "division_type": "thành phố trung ương",
    "codename": "hai_phong",
    "phone_code": 225,
    "wards": []
  },
  {
    "name": "Thành phố Đà Nẵng",
    "code": 48,
    "division_type": "thành phố trung ương",
    "codename": "da_nang",
    "phone_code": 236,
    "wards": []
  },
  {
    "name": "Thành phố Cần Thơ",
    "code": 92,
    "division_type": "thành phố trung ương",
    "codename": "can_tho",
    "phone_code": 292,
    "wards": []
  },
  {
    "name": "Tỉnh Hà Giang",
    "code": 2,
    "division_type": "tỉnh",
    "codename": "ha_giang",
    "phone_code": 219,
    "wards": []
  },
  {
    "name": "Tỉnh Cao Bằng",
    "code": 4,
    "division_type": "tỉnh",
    "codename": "cao_bang",
    "phone_code": 206,
    "wards": []
  },
  {
    "name": "Tỉnh Bắc Kạn",
    "code": 6,
    "division_type": "tỉnh",
    "codename": "bac_kan",
    "phone_code": 209,
    "wards": []
  },
  {
    "name": "Tỉnh Tuyên Quang",
    "code": 8,
    "division_type": "tỉnh",
    "codename": "tuyen_quang",
    "phone_code": 207,
    "wards": []
  },
  {
    "name": "Tỉnh Lào Cai",
    "code": 10,
    "division_type": "tỉnh",
    "codename": "lao_cai",
    "phone_code": 214,
    "wards": []
  },
  {
    "name": "Tỉnh Điện Biên",
    "code": 11,
    "division_type": "tỉnh",
    "codename": "dien_bien",
    "phone_code": 215,
    "wards": []
  },
  {
    "name": "Tỉnh Lai Châu",
    "code": 12,
    "division_type": "tỉnh",
    "codename": "lai_chau",
    "phone_code": 213,
    "wards": []
  },
  {
    "name": "Tỉnh Sơn La",
    "code": 14,
    "division_type": "tỉnh",
    "codename": "son_la",
    "phone_code": 212,
    "wards": []
  },
  {
    "name": "Tỉnh Yên Bái",
    "code": 15,
    "division_type": "tỉnh",
    "codename": "yen_bai",
    "phone_code": 216,
    "wards": []
  },
  {
    "name": "Tỉnh Hòa Bình",
    "code": 17,
    "division_type": "tỉnh",
    "codename": "hoa_binh",
    "phone_code": 218,
    "wards": []
  },
  {
    "name": "Tỉnh Thái Nguyên",
    "code": 19,
    "division_type": "tỉnh",
    "codename": "thai_nguyen",
    "phone_code": 208,
    "wards": []
  },
  {
    "name": "Tỉnh Lạng Sơn",
    "code": 20,
    "division_type": "tỉnh",
    "codename": "lang_son",
    "phone_code": 205,
    "wards": []
  },
  {
    "name": "Tỉnh Quảng Ninh",
    "code": 22,
    "division_type": "tỉnh",
    "codename": "quang_ninh",
    "phone_code": 203,
    "wards": []
  },
  {
    "name": "Tỉnh Bắc Giang",
    "code": 24,
    "division_type": "tỉnh",
    "codename": "bac_giang",
    "phone_code": 204,
    "wards": []
  },
  {
    "name": "Tỉnh Phú Thọ",
    "code": 25,
    "division_type": "tỉnh",
    "codename": "phu_tho",
    "phone_code": 210,
    "wards": []
  },
  {
    "name": "Tỉnh Vĩnh Phúc",
    "code": 26,
    "division_type": "tỉnh",
    "codename": "vinh_phuc",
    "phone_code": 211,
    "wards": []
  },
  {
    "name": "Tỉnh Bắc Ninh",
    "code": 27,
    "division_type": "tỉnh",
    "codename": "bac_ninh",
    "phone_code": 222,
    "wards": []
  },
  {
    "name": "Tỉnh Hải Dương",
    "code": 30,
    "division_type": "tỉnh",
    "codename": "hai_duong",
    "phone_code": 220,
    "wards": []
  },
  {
    "name": "Tỉnh Hưng Yên",
    "code": 33,
    "division_type": "tỉnh",
    "codename": "hung_yen",
    "phone_code": 221,
    "wards": []
  },
  {
    "name": "Tỉnh Thái Bình",
    "code": 34,
    "division_type": "tỉnh",
    "codename": "thai_binh",
    "phone_code": 227,
    "wards": []
  },
  {
    "name": "Tỉnh Hà Nam",
    "code": 35,
    "division_type": "tỉnh",
    "codename": "ha_nam",
    "phone_code": 226,
    "wards": []
  },
  {
    "name": "Tỉnh Nam Định",
    "code": 36,
    "division_type": "tỉnh",
    "codename": "nam_dinh",
    "phone_code": 228,
    "wards": []
  },
  {
    "name": "Tỉnh Ninh Bình",
    "code": 37,
    "division_type": "tỉnh",
    "codename": "ninh_binh",
    "phone_code": 229,
    "wards": []
  },
  {
    "name": "Tỉnh Thanh Hóa",
    "code": 38,
    "division_type": "tỉnh",
    "codename": "thanh_hoa",
    "phone_code": 237,
    "wards": []
  },
  {
    "name": "Tỉnh Nghệ An",
    "code": 40,
    "division_type": "tỉnh",
    "codename": "nghe_an",
    "phone_code": 238,
    "wards": []
  },
  {
    "name": "Tỉnh Hà Tĩnh",
    "code": 42,
    "division_type": "tỉnh",
    "codename": "ha_tinh",
    "phone_code": 239,
    "wards": []
  },
  {
    "name": "Tỉnh Quảng Bình",
    "code": 44,
    "division_type": "tỉnh",
    "codename": "quang_binh",
    "phone_code": 232,
    "wards": []
  },
  {
    "name": "Tỉnh Quảng Trị",
    "code": 45,
    "division_type": "tỉnh",
    "codename": "quang_tri",
    "phone_code": 233,
    "wards": []
  },
  {
    "name": "Tỉnh Thừa Thiên Huế",
    "code": 46,
    "division_type": "tỉnh",
    "codename": "thua_thien_hue",
    "phone_code": 234,
    "wards": []
  },
  {
    "name": "Tỉnh Quảng Nam",
    "code": 49,
    "division_type": "tỉnh",
    "codename": "quang_nam",
    "phone_code": 235,
    "wards": []
  },
  {
    "name": "Tỉnh Quảng Ngãi",
    "code": 51,
    "division_type": "tỉnh",
    "codename": "quang_ngai",
    "phone_code": 255,
    "wards": []
  },
  {
    "name": "Tỉnh Bình Định",
    "code": 52,
    "division_type": "tỉnh",
    "codename": "binh_dinh",
    "phone_code": 256,
    "wards": []
  },
  {
    "name": "Tỉnh Phú Yên",
    "code": 54,
    "division_type": "tỉnh",
    "codename": "phu_yen",
    "phone_code": 257,
    "wards": []
  },
  {
    "name": "Tỉnh Khánh Hòa",
    "code": 56,
    "division_type": "tỉnh",
    "codename": "khanh_hoa",
    "phone_code": 258,
    "wards": []
  },
  {
    "name": "Tỉnh Ninh Thuận",
    "code": 58,
    "division_type": "tỉnh",
    "codename": "ninh_thuan",
    "phone_code": 259,
    "wards": []
  },
  {
    "name": "Tỉnh Bình Thuận",
    "code": 60,
    "division_type": "tỉnh",
    "codename": "binh_thuan",
    "phone_code": 252,
    "wards": []
  },
  {
    "name": "Tỉnh Kon Tum",
    "code": 62,
    "division_type": "tỉnh",
    "codename": "kon_tum",
    "phone_code": 260,
    "wards": []
  },
  {
    "name": "Tỉnh Gia Lai",
    "code": 64,
    "division_type": "tỉnh",
    "codename": "gia_lai",
    "phone_code": 269,
    "wards": []
  },
  {
    "name": "Tỉnh Đắk Lắk",
    "code": 66,
    "division_type": "tỉnh",
    "codename": "dak_lak",
    "phone_code": 262,
    "wards": []
  },
  {
    "name": "Tỉnh Đắk Nông",
    "code": 67,
    "division_type": "tỉnh",
    "codename": "dak_nong",
    "phone_code": 261,
    "wards": []
  },
  {
    "name": "Tỉnh Lâm Đồng",
    "code": 68,
    "division_type": "tỉnh",
    "codename": "lam_dong",
    "phone_code": 263,
    "wards": []
  },
  {
    "name": "Tỉnh Bình Phước",
    "code": 70,
    "division_type": "tỉnh",
    "codename": "binh_phuoc",
    "phone_code": 271,
    "wards": []
  },
  {
    "name": "Tỉnh Tây Ninh",
    "code": 72,
    "division_type": "tỉnh",
    "codename": "tay_ninh",
    "phone_code": 276,
    "wards": []
  },
  {
    "name": "Tỉnh Bình Dương",
    "code": 74,
    "division_type": "tỉnh",
    "codename": "binh_duong",
    "phone_code": 274,
    "wards": []
  },
  {
    "name": "Tỉnh Đồng Nai",
    "code": 75,
    "division_type": "tỉnh",
    "codename": "dong_nai",
    "phone_code": 251,
    "wards": []
  },
  {
    "name": "Tỉnh Bà Rịa - Vũng Tàu",
    "code": 77,
    "division_type": "tỉnh",
    "codename": "ba_ria_vung_tau",
    "phone_code": 254,
    "wards": []
  },
  {
    "name": "Tỉnh Long An",
    "code": 80,
    "division_type": "tỉnh",
    "codename": "long_an",
    "phone_code": 272,
    "wards": []
  },
  {
    "name": "Tỉnh Tiền Giang",
    "code": 82,
    "division_type": "tỉnh",
    "codename": "tien_giang",
    "phone_code": 273,
    "wards": []
  },
  {
    "name": "Tỉnh Bến Tre",
    "code": 83,
    "division_type": "tỉnh",
    "codename": "ben_tre",
    "phone_code": 275,
    "wards": []
  },
  {
    "name": "Tỉnh Trà Vinh",
    "code": 84,
    "division_type": "tỉnh",
    "codename": "tra_vinh",
    "phone_code": 294,
    "wards": []
  },
  {
    "name": "Tỉnh Vĩnh Long",
    "code": 86,
    "division_type": "tỉnh",
    "codename": "vinh_long",
    "phone_code": 270,
    "wards": []
  },
  {
    "name": "Tỉnh Đồng Tháp",
    "code": 87,
    "division_type": "tỉnh",
    "codename": "dong_thap",
    "phone_code": 277,
    "wards": []
  },
  {
    "name": "Tỉnh An Giang",
    "code": 89,
    "division_type": "tỉnh",
    "codename": "an_giang",
    "phone_code": 296,
    "wards": []
  },
  {
    "name": "Tỉnh Kiên Giang",
    "code": 91,
    "division_type": "tỉnh",
    "codename": "kien_giang",
    "phone_code": 297,
    "wards": []
  },
  {
    "name": "Tỉnh Hậu Giang",
    "code": 93,
    "division_type": "tỉnh",
    "codename": "hau_giang",
    "phone_code": 293,
    "wards": []
  },
  {
    "name": "Tỉnh Sóc Trăng",
    "code": 94,
    "division_type": "tỉnh",
    "codename": "soc_trang",
    "phone_code": 299,
    "wards": []
  },
  {
    "name": "Tỉnh Bạc Liêu",
    "code": 95,
    "division_type": "tỉnh",
    "codename": "bac_lieu",
    "phone_code": 291,
    "wards": []
  },
  {
    "name": "Tỉnh Cà Mau",
    "code": 96,
    "division_type": "tỉnh",
    "codename": "ca_mau",
    "phone_code": 290,
    "wards": []
  }
];