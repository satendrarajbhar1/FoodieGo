import React from 'react'
import { useSelector } from 'react-redux'
import UserDashboard from '../components/UserDashboard'
import OwnerDashboard from '../components/OwnerDashboard'
import DeliveryBoy from '../components/DeliveryBoy'

const Home = () => {
  const { userData, authLoading } = useSelector(state => state.user)

  if (authLoading) {
    return <div className="p-10 text-center text-sm text-gray-500">Loading...</div>
  }

  if (userData?.role === "owner") return <OwnerDashboard />
  if (userData?.role === "deliveryBoy") return <DeliveryBoy />

 
  return <UserDashboard />
}

export default Home