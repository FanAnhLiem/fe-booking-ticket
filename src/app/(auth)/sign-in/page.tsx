'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { toast } from 'sonner'; // 1. IMPORT TOAST

// Import file utils jwt của bạn
import { getPayloadFromToken, CustomJwtPayload } from '@/utils/jwt';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập tài khoản')
    .email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function CardLogin() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const responseData = await res.json();

      // Kiểm tra lỗi
      if (!res.ok || responseData.code !== 0) {
        throw new Error(
          responseData.message || 'Tài khoản hoặc mật khẩu không đúng'
        );
      }

      const token = responseData.result?.token;
      if (!token) {
        throw new Error('Lỗi hệ thống: Không nhận được token');
      }

      // Lưu token
      localStorage.setItem('accessToken', token);

      // 2. THÔNG BÁO THÀNH CÔNG
      toast.success('Đăng nhập thành công!', {
        description: 'Chào mừng bạn quay trở lại hệ thống.',
        duration: 3000, // Tự tắt sau 3 giây
      });

      // Xử lý điều hướng
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
      console.error('Login Error:', error);

      // 3. THÔNG BÁO THẤT BẠI
      toast.error('Đăng nhập thất bại', {
        description: error.message || 'Có lỗi xảy ra, vui lòng thử lại.',
        duration: 4000,
      });
    }
  };

  return (
    <div>
      <Card className="w-full max-w-sm mx-auto transform translate-y-65/100">
        <CardHeader>
          <CardTitle>Đăng nhập hệ thống</CardTitle>
          <CardDescription>
            Nhập thông tin tài khoản để tiếp tục
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-6">
              {/* Đã xóa phần hiển thị errors.root vì giờ dùng Toast rồi */}

              <div className="grid gap-2">
                <Label htmlFor="email">Tài khoản / Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="admin"
                  autoComplete="off"
                  {...register('email')}
                />
                {errors.email && (
                  <span className="text-red-500 text-xs">
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Mật khẩu</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <span className="text-red-500 text-xs">
                    {errors.password.message}
                  </span>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : null}
              {isSubmitting ? 'Đang xử lý...' : 'Đăng Nhập'}
            </Button>
          </form>
        </CardContent>
        <CardFooter />
      </Card>
    </div>
  );
}
