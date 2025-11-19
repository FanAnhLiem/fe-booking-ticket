'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Import utils JWT giống trang sign-in
import { getPayloadFromToken, CustomJwtPayload } from '@/utils/jwt';

// 1. Định nghĩa luật kiểm tra (Validation Schema)
const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Vui lòng nhập Email')
      .email('Email không đúng định dạng'),
    name: z
      .string()
      .min(4, 'Tên phải có ít nhất 4 kí tự')
      .refine((val) => isNaN(Number(val)), {
        message: 'Tên không được bao gồm toàn số',
      }),
    phone: z
      .string()
      .length(10, 'Số điện thoại phải đủ 10 số')
      .regex(/^\d+$/, 'Số điện thoại chỉ được chứa số'),
    birthday: z
      .string()
      .regex(
        /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
        'Ngày sinh phải đúng định dạng dd/mm/yyyy'
      ),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 kí tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'], // Lỗi sẽ hiện ở trường confirmPassword
  });

// 2. Khai báo type dữ liệu form
type RegisterFormValues = z.infer<typeof registerSchema>;

// Kiểu response từ backend (giống login)
interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

interface TokenResponse {
  token: string;
  authenticated?: boolean;
}

export default function CardRegister() {
  const router = useRouter();

  // 2. Khởi tạo form hook
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  // 3. Hàm xử lý khi form hợp lệ -> gọi API backend
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const res = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          name: data.name,
          phone: data.phone,
          birthday: data.birthday,
        }),
      });

      const responseData: ApiResponse<TokenResponse> = await res.json();

      if (!res.ok || responseData.code !== 0) {
        throw new Error(
          responseData.message || 'Đăng kí thất bại, vui lòng thử lại.'
        );
      }

      const token = responseData.result?.token;
      if (!token) {
        throw new Error('Lỗi hệ thống: Không nhận được token');
      }

      // Lưu token giống trang đăng nhập
      localStorage.setItem('accessToken', token);

      // Thông báo thành công
      toast.success('Đăng kí thành công!', {
        description: 'Chào mừng bạn đến với hệ thống.',
        duration: 3000,
      });

      // Decode JWT để điều hướng dựa theo role (giống login)
      const payload = getPayloadFromToken<CustomJwtPayload>(token);
      if (payload) {
        const userRole = payload.role;
        if (userRole?.includes('ADMIN')) {
          router.push('/admin/statistical');
        } else {
          router.push('/movie-showing');
        }
      } else {
        router.push('/');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Register Error:', error);
      toast.error('Đăng kí thất bại', {
        description: error.message || 'Có lỗi xảy ra, vui lòng thử lại.',
        duration: 4000,
      });
    }
  };

  return (
  // Wrapper full height + flex center
  <div className="min-h-screen flex items-center justify-center">
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="mx-auto">Đăng Kí Tài Khoản</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-6">
            {/* EMAIL */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email...."
                autoComplete="off"
                {...register('email')}
              />
              {errors.email && (
                <span className="text-red-500 text-xs">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* NAME */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter name...."
                autoComplete="off"
                {...register('name')}
              />
              {errors.name && (
                <span className="text-red-500 text-xs">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* PHONE */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="text"
                placeholder="Enter phone number...."
                autoComplete="off"
                maxLength={10}
                {...register('phone')}
              />
              {errors.phone && (
                <span className="text-red-500 text-xs">
                  {errors.phone.message}
                </span>
              )}
            </div>

            {/* BIRTHDAY */}
            <div className="grid gap-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="text"
                placeholder="dd/mm/yyyy"
                autoComplete="off"
                {...register('birthday')}
              />
              {errors.birthday && (
                <span className="text-red-500 text-xs">
                  {errors.birthday.message}
                </span>
              )}
            </div>

            {/* PASSWORD */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password...."
                autoComplete="off"
                {...register('password')}
              />
              {errors.password && (
                <span className="text-red-500 text-xs">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Enter confirm password...."
                autoComplete="off"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <span className="text-red-500 text-xs">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full cursor-pointer mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Đang xử lý...
                </>
              ) : (
                'Đăng Kí'
              )}
            </Button>

            <p className="text-xs text-center text-slate-500 mt-1">
              Đã có tài khoản?{' '}
              <Link href="/sign-in" className="text-blue-600 hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">{/* Footer nếu cần */}</CardFooter>
    </Card>
  </div>
);

}
