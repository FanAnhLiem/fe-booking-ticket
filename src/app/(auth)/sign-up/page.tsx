'use client'; 

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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

// 1. Định nghĩa luật kiểm tra (Validation Schema)
const registerSchema = z.object({
    email: z.string().min(1, 'Vui lòng nhập Email').email('Email không đúng định dạng'),
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

// Tạo kiểu dữ liệu từ Schema (Optional - dùng cho TypeScript)
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function CardRegister() {
  // 2. Khởi tạo form hook
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  // 3. Hàm xử lý khi form hợp lệ
  const onSubmit = (data: RegisterFormValues) => {
    console.log('Dữ liệu đăng kí thành công:', data);
    alert('Đăng kí thành công!');
  };

  return (
    <div>
      <Card className="w-full max-w-sm mx-auto transform translate-y-1/5">
        <CardHeader>
          <CardTitle className="mx-auto">Đăng Kí Tài Khoản</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Thay thẻ form thường bằng onSubmit của hook form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-6">
              
              {/* EMAIL */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="off"
                  {...register('email')} // Kết nối input với form
                />
                {errors.email && (
                  <span className="text-red-500 text-xs">{errors.email.message}</span>
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
                  <span className="text-red-500 text-xs">{errors.name.message}</span>
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
                  <span className="text-red-500 text-xs">{errors.phone.message}</span>
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

              <Button type="submit" className="w-full cursor-pointer mt-2">
                Đăng Kí
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          {/* Footer content (nếu cần) */}
        </CardFooter>
      </Card>
    </div>
  );
}