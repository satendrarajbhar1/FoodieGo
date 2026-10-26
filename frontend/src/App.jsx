import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import CreateEditShop from './pages/CreateEditShop'
import AddItem from './pages/AddItem'
import ShopPage from './pages/ShopPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import MyOrdersPage from './pages/MyOrdersPage'
import OwnerOrdersPage from './pages/OwnerOrderPage'

import useGetCurrentUser from './hooks/useGetCurrentUser'
import useGetCity from './hooks/useGetCity'
import useGetMyShop from './hooks/useGetMyShop'
import useGetShopsByCity from './hooks/useGetShopsByCity'
import useSocket from './hooks/useSocket'

// Live par Vercel ke env se aayega, local me localhost
export const serverUrl =
  import.meta.env.VITE_SERVER_URL || "http://localhost:8000"

// Login zaroori wale pages. roles diya ho to sirf wahi role andar aa sakta hai.
const ProtectedRoute = ({ children, roles }) => {
  const { userData, authLoading } = useSelector(state => state.user)
  const location = useLocation()

  if (authLoading) {
    return <div className="p-10 text-center text-sm text-gray-500">Loading...</div>
  }

  if (!userData) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />
  }

  if (roles && !roles.includes(userData.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

// Sirf guest ke liye (signin/signup). Login ke baad wapas wahi bhejo jahan se aaya tha.
const GuestRoute = ({ children }) => {
  const { userData, authLoading } = useSelector(state => state.user)
  const location = useLocation()

  if (authLoading) return null

  if (userData) {
    return <Navigate to={location.state?.from || "/"} replace />
  }

  return children
}

const App = () => {
  useGetCurrentUser()
  useGetCity()
  useGetMyShop()
  useGetShopsByCity()
  useSocket()

  return (
    <Routes>
      {/* Guest only */}
      <Route path="/signup" element={<GuestRoute><SignUp /></GuestRoute>} />
      <Route path="/signin" element={<GuestRoute><SignIn /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

      {/* Public: bina login ke dekh sakte hain */}
      <Route path="/" element={<Home />} />
      <Route path="/shop/:shopId" element={<ShopPage />} />
      <Route path="/cart" element={<CartPage />} />

      {/* Login required */}
      <Route path="/checkout" element={<ProtectedRoute roles={['user']}><CheckoutPage /></ProtectedRoute>} />
      <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
      <Route path="/owner-orders" element={<ProtectedRoute roles={['owner']}><OwnerOrdersPage /></ProtectedRoute>} />
      <Route path="/create-edit-shop" element={<ProtectedRoute roles={['owner']}><CreateEditShop /></ProtectedRoute>} />
      <Route path="/add-food" element={<ProtectedRoute roles={['owner']}><AddItem /></ProtectedRoute>} />

      {/* Unknown route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App