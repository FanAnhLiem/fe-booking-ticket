import { jwtDecode, JwtPayload } from "jwt-decode";

export interface CustomJwtPayload extends JwtPayload {
  role?: string;
  email?: string;
  fullName?: string;
  iss?: string;
  sub?: string;
  jti?: string;
  // Thêm các field khác tùy ý
}

/**
 * Hàm giải mã token lấy payload
 * @param token - Chuỗi JWT cần giải mã
 * @returns Trả về object Payload theo kiểu T hoặc null nếu lỗi
 */
export const getPayloadFromToken = <T = CustomJwtPayload>(token: string): T | null => {
  if (!token) return null;

  try {
    return jwtDecode<T>(token);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Hàm kiểm tra token đã hết hạn hay chưa
 * @param token - Chuỗi JWT
 * @returns true nếu hết hạn hoặc lỗi, false nếu còn hạn
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = getPayloadFromToken<JwtPayload>(token);

  // Nếu không giải mã được hoặc không có trường exp, coi như hết hạn cho an toàn
  if (!decoded || !decoded.exp) return true;

  // Date.now() trả về mili-giây, còn exp của JWT là giây -> cần chia 1000
  const currentTime = Date.now() / 1000;
  
  return decoded.exp < currentTime;
};