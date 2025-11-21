'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { toast } from 'sonner';

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

      if (!res.ok || responseData.code !== 0) {
        throw new Error(
          responseData.message || 'Tài khoản hoặc mật khẩu không đúng',
        );
      }

      const token = responseData.result?.token;
      if (!token) {
        throw new Error('Lỗi hệ thống: Không nhận được token');
      }

      // lưu token
      localStorage.setItem('accessToken', token);

      toast.success('Đăng nhập thành công!', {
        description: 'Chào mừng bạn quay trở lại hệ thống.',
        duration: 3000,
      });

      // === ĐIỀU HƯỚNG MỚI ===
      const payload = getPayloadFromToken<CustomJwtPayload>(token);
      if (payload) {
        const userRole = payload.role;
        if (userRole?.includes('ADMIN')) {
          // Admin -> trang thống kê
          router.push('/admin/statistical');
        } else {
          // User thường -> TRANG CHỦ
          router.push('/');
        }
      } else {
        // Không đọc được payload thì cũng đưa về trang chủ
        router.push('/');
      }
    } catch (error: any) {
      console.error('Login Error:', error);

      toast.error('Đăng nhập thất bại', {
        description: error.message || 'Có lỗi xảy ra, vui lòng thử lại.',
        duration: 4000,
      });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md shadow-lg border border-slate-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-center">
            Đăng nhập hệ thống
          </CardTitle>
          <CardDescription className="text-center text-sm">
            Nhập thông tin tài khoản để tiếp tục
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm">
                  Tài khoản / Email
                </Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="admin@example.com"
                  autoComplete="off"
                  className="h-11 text-sm"
                  {...register('email')}
                />
                {errors.email && (
                  <span className="text-red-500 text-xs">
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm">
                    Mật khẩu
                  </Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-11 text-sm"
                  {...register('password')}
                />
                {errors.password && (
                  <span className="text-red-500 text-xs">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <span className="animate-spin mr-2">⏳</span>
                )}
                {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <div className="w-full flex items-center justify-center">
            <span className="text-xs text-slate-500">
              Chưa có tài khoản?
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 text-sm font-semibold"
            onClick={() => router.push('/sign-up')}
          >
            Đăng ký tài khoản
          </Button>

          <div className="w-full text-center mt-1">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline"
            >
              ← Quay lại trang chủ
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
