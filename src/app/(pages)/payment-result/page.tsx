'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const BASE_API = 'http://localhost:8080/api';
const VNPAY_RETURN_API = `${BASE_API}/vnpay/return`;

interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'success' | 'fail'>('pending');
  const [message, setMessage] = useState<string>('Đang xử lý kết quả thanh toán...');

  useEffect(() => {
    const responseCode = searchParams.get('vnp_ResponseCode') ?? '';
    const txnRef = searchParams.get('vnp_TxnRef') ?? '';

    // Nếu thiếu param => fail luôn
    if (!responseCode || !txnRef) {
      setStatus('fail');
      setMessage('Thiếu thông tin từ VNPay. Vui lòng kiểm tra lại.');
      return;
    }

    const callBackend = async () => {
      try {
        // nếu API /vnpay/return yêu cầu token thì đọc token ở đây
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;

        const res = await fetch(
          `${VNPAY_RETURN_API}?vnp_ResponseCode=${encodeURIComponent(
            responseCode,
          )}&vnp_TxnRef=${encodeURIComponent(txnRef)}`,
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : undefined,
          },
        );

        let text = await res.text();
        let data: ApiResponse<string> | null = null;
        try {
          data = text ? (JSON.parse(text) as ApiResponse<string>) : null;
        } catch {
          // BE trả plain text thì dùng luôn
        }

        if (!res.ok) {
          setStatus('fail');
          setMessage(data?.message || text || 'Thanh toán không thành công.');
          return;
        }

        // Theo VNPay: 00 = thành công
        if (responseCode === '00') {
          setStatus('success');
          setMessage(
            data?.result ||
              data?.message ||
              'Thanh toán thành công. Vé của bạn đã được ghi nhận.',
          );
        } else {
          setStatus('fail');
          setMessage(
            data?.result ||
              data?.message ||
              'Thanh toán không thành công hoặc đã bị huỷ.',
          );
        }
      } catch (err: any) {
        console.error('Lỗi gọi /vnpay/return:', err);
        setStatus('fail');
        setMessage(
          err?.message || 'Có lỗi xảy ra khi xử lý kết quả thanh toán.',
        );
      }
    };

    callBackend();
  }, [searchParams]);

  const isSuccess = status === 'success';

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-slate-800/80 border border-slate-700 rounded-3xl px-6 py-7 md:px-8 md:py-9 text-center space-y-5">
        <h1 className="text-2xl md:text-3xl font-bold">
          {status === 'pending'
            ? 'Đang xử lý thanh toán...'
            : isSuccess
            ? 'Thanh toán thành công'
            : 'Thanh toán thất bại'}
        </h1>

        <p className="text-sm md:text-base text-slate-200">{message}</p>

        {status !== 'pending' && (
          <div className="space-x-3 mt-4">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-full bg-rose-600 text-white text-sm md:text-base font-semibold hover:bg-rose-700"
            >
              Về trang chủ
            </Link>
            <Link
              href="/cinemas"
              className="inline-block px-5 py-2.5 rounded-full border border-slate-600 text-sm md:text-base text-slate-100 hover:bg-slate-700"
            >
              Đặt vé khác
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
