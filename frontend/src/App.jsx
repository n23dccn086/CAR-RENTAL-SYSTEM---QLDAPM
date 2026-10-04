import { Routes, Route } from 'react-router-dom'
import Cursor from './components/Cursor'
import Header from './components/Header'
import Footer from './components/Footer'
import Ticker from './components/Ticker'
import Concierge from './components/Concierge'
import CarDecor from './components/CarDecor'
import ProtectedRoute from './components/ProtectedRoute'

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
import AdminUsersPage from './pages/AdminUsersPage'
import AdminRefundsPage from './pages/AdminRefundsPage'
import DriverAssignmentPage from './pages/DriverAssignmentPage'
import OwnerBookingsPage from './pages/OwnerBookingsPage'
import OwnerDriversPage from './pages/OwnerDriversPage'
import NotificationsPage from './pages/NotificationsPage'
import ReviewPage from './pages/ReviewPage'
import OwnerReviewsPage from './pages/OwnerReviewsPage'              // ← THÊM MỚI

function App() {
  return (
    <>
      <Cursor />
      <CarDecor />
      <Ticker />
      <Header />
      <main style={{ minHeight: '60vh', position: 'relative', zIndex: 2 }}>
        <Routes>
          {/* ===== PUBLIC ===== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cars/:id" element={<CarDetailPage />} />

          {/* ===== DRIVER MAGIC LINK — PUBLIC ===== */}
          <Route path="/driver/assignment/:id" element={<DriverAssignmentPage />} />

          {/* ===== CẦN ĐĂNG NHẬP ===== */}
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER', 'DRIVER', 'ADMIN']}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/my-bookings" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
              <MyBookingsPage />
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER', 'DRIVER', 'ADMIN']}>
              <NotificationsPage />
            </ProtectedRoute>
          } />

          <Route path="/booking/:carId" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
              <BookingPage />
            </ProtectedRoute>
          } />

          <Route path="/payment/:bookingId" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
              <PaymentPage />
            </ProtectedRoute>
          } />

          <Route path="/review/:bookingId" element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
              <ReviewPage />
            </ProtectedRoute>
          } />

          {/* ===== OWNER ===== */}
          <Route path="/cars/create" element={
            <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
              <CreateCarPage />
            </ProtectedRoute>
          } />

          <Route path="/owner/dashboard" element={
            <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
              <OwnerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/owner/bookings" element={
            <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
              <OwnerBookingsPage />
            </ProtectedRoute>
          } />

          <Route path="/owner/drivers" element={
            <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
              <OwnerDriversPage />
            </ProtectedRoute>
          } />

          {/* ===== OWNER REVIEWS — MỚI ===== */}
          <Route path="/owner/reviews" element={
            <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
              <OwnerReviewsPage />
            </ProtectedRoute>
          } />

          {/* ===== ADMIN ===== */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />

          <Route path="/admin/refunds" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminRefundsPage />
            </ProtectedRoute>
          } />

          {/* ===== 404 ===== */}
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