import { Routes, Route } from 'react-router-dom'
import Cursor from './components/Cursor'
import Header from './components/Header'
import Footer from './components/Footer'
import Ticker from './components/Ticker'
import Concierge from './components/Concierge'
import CarDecor from './components/CarDecor'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SearchPage from './pages/SearchPage'
import CarDetailPage from './pages/CarDetailPage'
import BookingPage from './pages/BookingPage'
import PaymentPage from './pages/PaymentPage'
import MyBookingsPage from './pages/MyBookingsPage'
import OwnerDashboard from './pages/OwnerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ProfilePage from './pages/ProfilePage'
import CreateCarPage from './pages/CreateCarPage'

function App() {
  return (
    <>
      <Cursor />
      <CarDecor />
      <Ticker />
      <Header />
      <main style={{ minHeight: '60vh', position: 'relative', zIndex: 2 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cars/:id" element={<CarDetailPage />} />
          <Route path="/cars/create" element={<CreateCarPage />} />
          <Route path="/booking/:carId" element={<BookingPage />} />
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '120px 48px' }}>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: '96px', fontWeight: 900, color: 'var(--do)' }}>404</h1>
              <p style={{ fontFamily: 'var(--serif-2)', fontStyle: 'italic', fontSize: '24px', color: 'var(--muc-mo)' }}>Trang này không tồn tại.</p>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
      <Concierge />
    </>
  )
}

export default App