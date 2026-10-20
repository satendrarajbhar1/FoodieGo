import React from 'react'
import { useSelector } from 'react-redux'
import UserDashboard from '../components/UserDashboard'
import OwnerDashboard from '../components/OwnerDashboard'
import DeliveryBoy from '../components/DeliveryBoy'

const Home = () => {
  const { userData } = useSelector(state => state.user)

  if (!userData) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {userData.role === "user" && <UserDashboard/>}
      {userData.role === "owner" && <OwnerDashboard />}
      {userData.role === "deliveryBoy" && <DeliveryBoy />}
    </div>
  )
}

export default Home