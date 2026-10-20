import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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

const App = () => {
  useGetCurrentUser()
  useGetCity()
  useGetMyShop()
  useGetShopsByCity()
  useSocket()

  const { userData } = useSelector(state => state.user)

  return (
    <Routes>
      <Route
        path="/signup"
        element={!userData ? <SignUp /> : <Navigate to="/" />}
      />

      <Route
        path="/signin"
        element={!userData ? <SignIn /> : <Navigate to="/" />}
      />

      <Route
        path="/forgot-password"
        element={!userData ? <ForgotPassword /> : <Navigate to="/" />}
      />

      <Route
        path="/"
        element={userData ? <Home /> : <Navigate to="/signin" />}
      />

      <Route
        path="/create-edit-shop"
        element={userData ? <CreateEditShop /> : <Navigate to="/signin" />}
      />

      <Route
        path="/add-food"
        element={userData ? <AddItem /> : <Navigate to="/signin" />}
      />

      <Route
        path="/shop/:shopId"
        element={userData ? <ShopPage /> : <Navigate to="/signin" />}
      />

      <Route
        path="/cart"
        element={userData ? <CartPage /> : <Navigate to="/signin" />}
      />

      <Route
        path="/checkout"
        element={userData ? <CheckoutPage /> : <Navigate to="/signin" />}
      />

      <Route
        path="/my-orders"
        element={userData ? <MyOrdersPage /> : <Navigate to="/signin" />}
      />

      <Route
        path="/owner-orders"
        element={userData ? <OwnerOrdersPage /> : <Navigate to="/signin" />}
      />

      {/* Unknown route */}
      <Route
        path="*"
        element={<Navigate to={userData ? "/" : "/signin"} replace />}
      />
    </Routes>
  )
}

export default App