'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';

const BASE_API = 'http://localhost:8080/api';
const VNPAY_RETURN_API = `${BASE_API}/vnpay/return`;

interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
}

type Status = 'loading' | 'success' | 'fail';

const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState<string>('');
  const [txnRef, setTxnRef] = useState<string>('');

  useEffect(() => {
    const responseCode = searchParams.get('vnp_ResponseCode');
    const vnpTxnRef = searchParams.get('vnp_TxnRef');

    if (!responseCode || !vnpTxnRef) {
      setStatus('fail');
      setMessage('Thiếu thông tin thanh toán từ VNPay.');
      return;
    }

    setTxnRef(vnpTxnRef);

    const callBackend = async () => {
      try {
        const token = getAccessToken();
        const url = `${VNPAY_RETURN_API}?vnp_ResponseCode=${encodeURIComponent(
          responseCode,
        )}&vnp_TxnRef=${encodeURIComponent(vnpTxnRef)}`;

        const res = await fetch(url, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const raw = await res.text();
        let data: ApiResponse<string> | null = null;
        try {
          if (raw) data = JSON.parse(raw) as ApiResponse<string>;
        } catch {
          // ignore
        }

        const backendMsg =
          data?.message || data?.result || 'Hệ thống đã xử lý kết quả thanh toán.';

        if (!res.ok) {
          setStatus('fail');
          setMessage(backendMsg);
          return;
        }

        if (responseCode === '00') {
          setStatus('success');
          setMessage(
            backendMsg ||
              'Thanh toán thành công! Vé của bạn sẽ được cập nhật trong hệ thống.',
          );
        } else {
          setStatus('fail');
          setMessage(
            backendMsg ||
              'Thanh toán không thành công hoặc đã bị hủy. Vui lòng thử lại.',
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
    <main className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full bg-white border border-gray-100 rounded-3xl shadow-md px-6 py-7 md:px-8 md:py-9 text-center space-y-5">
        {/* ICON & TITLE */}
        <div className="flex flex-col items-center gap-3">
          {status === 'loading' ? (
            <>
              <div className="w-14 h-14 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                Đang xác nhận thanh toán...
              </h1>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              <h1 className="text-xl md:text-2xl font-semibold text-emerald-600">
                Thanh toán thành công
              </h1>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-500" />
              <h1 className="text-xl md:text-2xl font-semibold text-red-600">
                Thanh toán không thành công
              </h1>
            </>
          )}
        </div>

        {/* MESSAGE */}
        <p className="text-sm md:text-base text-gray-700 leading-relaxed">
          {message ||
            (status === 'loading'
              ? 'Vui lòng chờ trong giây lát...'
              : isSuccess
              ? 'Thanh toán của bạn đã được ghi nhận.'
              : 'Đơn hàng chưa được thanh toán.')}
        </p>

        {/* INFO */}
        {txnRef && (
          <div className="inline-flex flex-col items-center px-4 py-2 rounded-2xl bg-slate-50 border border-gray-200 text-xs md:text-sm text-gray-700">
            <span className="font-medium">Mã giao dịch (TxnRef)</span>
            <span className="mt-1 font-mono text-[13px] break-all">
              {txnRef}
            </span>
          </div>
        )}

        {/* BUTTONS */}
        {status !== 'loading' && (
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link
              href="/home"
              className="inline-block px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm md:text-base font-semibold hover:bg-blue-700 shadow-sm"
            >
              Về trang chủ
            </Link>
            <Link
              href="/cinemas"
              className="inline-block px-5 py-2.5 rounded-full border border-gray-300 text-sm md:text-base text-gray-800 hover:bg-gray-100"
            >
              Đặt vé khác
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
