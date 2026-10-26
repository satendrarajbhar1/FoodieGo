import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FaLocationDot } from 'react-icons/fa6'
import { IoSearch } from 'react-icons/io5'
import { FiShoppingCart, FiPlus } from 'react-icons/fi'
import { serverUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import { setMyShopData } from '../redux/ownerSlice'
import { clearCart } from '../redux/cartSlice'

const Nav = () => {
  const { userData, currentCity } = useSelector(state => state.user)
  const { myShopData } = useSelector(state => state.owner)
  const cartItems = useSelector(state => state.cart.items)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Guest aur normal user dono customer hain
  const isCustomer = !userData || userData.role === 'user'

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  const [showProfile, setShowProfile] = useState(false)

  // Search suggestions
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState({ shops: [], items: [] })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef(null)

  // Debounce: user 300ms ruke tab hi API call hogi
  useEffect(() => {
    const text = query.trim()

    if (!text || !isCustomer) {
      setSuggestions({ shops: [], items: [] })
      setSearching(false)
      return
    }

    let cancelled = false
    setSearching(true)

    const timer = setTimeout(async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/item/search`, {
          // city mili ho tabhi bhejo, warna sab jagah se search hoga
          params: currentCity ? { q: text, city: currentCity } : { q: text },
          withCredentials: true,
        })

        if (!cancelled) {
          setSuggestions({
            shops: result.data.shops || [],
            items: result.data.items || [],
          })
        }
      } catch (error) {
        if (!cancelled) {
          console.log('Search error:', error.response?.data || error)
          setSuggestions({ shops: [], items: [] })
        }
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, currentCity, isCustomer])

  // Dropdown ke bahar click karne par band karo
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const openShop = (shopId) => {
    if (!shopId) return
    setShowSuggestions(false)
    setQuery('')
    navigate(`/shop/${shopId}`)
  }

  const hasResults = suggestions.shops.length > 0 || suggestions.items.length > 0

  const handleLogout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, {
        withCredentials: true
      })

      dispatch(setUserData(null))
      dispatch(setMyShopData(null))
      dispatch(clearCart())
      setShowProfile(false)
      navigate('/')
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <nav className="w-full bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <h1
          onClick={() => navigate('/')}
          className="cursor-pointer text-2xl font-bold text-red-500 sm:text-3xl"
        >
          Tomato
        </h1>

        {/* Location and Search (guest + user) */}
        {isCustomer && (
          <div className="order-3 flex w-full flex-col gap-3 sm:order-none sm:w-auto sm:flex-1 sm:flex-row sm:items-center sm:justify-center sm:px-4">

            {currentCity && (
              <div className="flex shrink-0 items-center gap-2 text-gray-700">
                <FaLocationDot className="text-lg text-red-500" />
                <span className="text-sm font-medium">{currentCity}</span>
              </div>
            )}

            <div ref={searchRef} className="relative min-w-0 sm:max-w-sm sm:flex-1">
              <div className="flex min-w-0 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 focus-within:border-red-400">
                <IoSearch className="shrink-0 text-xl text-gray-500" />

                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search delicious food..."
                  className="w-full min-w-0 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && query.trim() && (
                <div className="absolute left-0 right-0 top-12 z-50 max-h-96 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">

                  {searching && !hasResults && (
                    <p className="px-4 py-3 text-sm text-gray-500">Searching...</p>
                  )}

                  {!searching && !hasResults && (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      No results found for "{query.trim()}"
                    </p>
                  )}

                  {suggestions.shops.length > 0 && (
                    <div>
                      <p className="bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Restaurants
                      </p>

                      {suggestions.shops.map((shop) => (
                        <button
                          key={shop._id}
                          type="button"
                          onClick={() => openShop(shop._id)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-red-50"
                        >
                          {shop.image && (
                            <img
                              src={shop.image}
                              alt={shop.name}
                              className="h-9 w-9 shrink-0 rounded-lg object-cover"
                            />
                          )}
                          <span className="truncate text-sm font-medium text-gray-800">
                            {shop.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {suggestions.items.length > 0 && (
                    <div>
                      <p className="bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Dishes
                      </p>

                      {suggestions.items.map((item) => (
                        <button
                          key={item._id}
                          type="button"
                          onClick={() => openShop(item.shop?._id)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-red-50"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-9 w-9 shrink-0 rounded-lg object-cover"
                            />
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {item.name}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {item.shop?.name}
                            </p>
                          </div>

                          <span className="shrink-0 text-sm font-semibold text-red-500">
                            ₹{item.price}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Owner Actions */}
        {userData?.role === "owner" && myShopData && (
          <>
            <button
              type="button"
              onClick={() => navigate("/add-food")}
              className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              <FiPlus size={20} />
              <span>Add Food Item</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/owner-orders")}
              className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >
              My Orders
            </button>
          </>
        )}

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-5">

          {/* Cart: guest + user */}
          {isCustomer && (
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="relative flex items-center gap-2 text-gray-700 transition hover:text-red-500"
            >
              <FiShoppingCart className="text-xl sm:text-2xl" />
              <span className="text-sm font-medium">{cartCount}</span>
            </button>
          )}

          {/* Guest: Sign In button */}
          {!userData && (
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 sm:px-5"
            >
              Sign In
            </button>
          )}

          {/* My Orders: sirf logged-in user */}
          {userData?.role === "user" && (
            <button
              type="button"
              onClick={() => navigate('/my-orders')}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 sm:px-5"
            >
              My Orders
            </button>
          )}

          {/* Profile Dropdown: sirf logged-in */}
          {userData && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfile(!showProfile)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-lg font-semibold uppercase text-red-600 transition hover:bg-red-200"
              >
                {userData.fullName?.slice(0, 1) || ''}
              </button>

              {showProfile && (
                <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">

                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-xs text-gray-500">
                      Signed in as
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                      {userData.fullName}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-500 transition hover:bg-red-50"
                  >
                    Logout
                  </button>

                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </nav>
  )
}

export default Nav