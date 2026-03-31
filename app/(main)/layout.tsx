import TopBar from '@/components/TopBar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <TopBar />
      <main className="flex-1 w-full pt-16 mt-4">
        {children}
      </main>
    </div>
  );
}
