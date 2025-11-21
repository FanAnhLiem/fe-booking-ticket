// src/app/(pages)/layout.tsx
import type { ReactNode } from 'react';
import Header from '@/components/header';
import ChatWidget from '@/components/chat/ChatWidget';  // 👈 đúng path file bạn đang có

export default function PageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      {/* Nút + hộp chat nổi ở góc dưới bên phải */}
      <ChatWidget />
    </>
  );
}
