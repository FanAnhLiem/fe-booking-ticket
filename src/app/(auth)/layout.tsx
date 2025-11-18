import { Toaster } from "@/components/ui/sonner"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {' '}
      {children}
      <Toaster position="top-right" richColors />{' '}
      {/* Thêm dòng này, chỉnh position tùy ý */}
    </div>
  );
}