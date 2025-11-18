import Header from "@/components/header";

// app/layout.tsx
export const metadata = {
  title: 'My App',
  description: 'Description',
};

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>
    <Header></Header>
    {children}
    </div>;
}
