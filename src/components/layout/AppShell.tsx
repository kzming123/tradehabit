import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Header } from "./Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#020617]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="px-5 py-7 md:px-8 md:py-10 pb-28 md:pb-10 max-w-[1200px] mx-auto animate-fade-up">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
