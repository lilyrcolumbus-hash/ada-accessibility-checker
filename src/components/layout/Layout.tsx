import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { UrgencyBanner } from './UrgencyBanner';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <UrgencyBanner />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
