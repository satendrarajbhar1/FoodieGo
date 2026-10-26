import React from 'react'
import Nav from './Nav'
import { useSelector } from 'react-redux'
import { FaUtensils, FaPen, FaPlus } from "react-icons/fa6"
import {
  FiArrowRight,
  FiMapPin,
  FiPackage
} from "react-icons/fi"
import { useNavigate } from 'react-router-dom'

function OwnerDashboard() {
  const navigate = useNavigate()
  const { myShopData } = useSelector(state => state.owner)

  const shopItems = myShopData?.items || myShopData?.item || []

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <Nav />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">

        {!myShopData ? (

          /* No Restaurant Yet */
          <div className="flex min-h-[65vh] items-center justify-center">
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg transition duration-300 hover:shadow-xl">

              <div className="bg-gradient-to-br from-red-500 via-red-500 to-orange-400 px-6 py-10 text-center text-white sm:px-12 sm:py-14">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 shadow-inner transition duration-300 hover:rotate-6 hover:scale-110">
                  <FaUtensils className="text-4xl" />
                </div>

                <h1 className="text-3xl font-bold sm:text-4xl">
                  Add Your Restaurant
                </h1>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/90 sm:text-base">
                  Bring your delicious food online and connect with
                  more customers through FoodieGo.
                </p>
              </div>

              <div className="px-6 py-9 text-center sm:px-12 sm:py-10">
                <h2 className="text-xl font-bold text-gray-800">
                  Start Your Food Business
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
                  Create your restaurant profile and start managing
                  your food items and customer orders.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/create-edit-shop")}
                  className="mx-auto mt-7 flex items-center justify-center gap-2 rounded-full bg-red-500 px-7 py-3.5 font-semibold text-white shadow-md shadow-red-200 transition duration-200 hover:-translate-y-1 hover:bg-red-600 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-200"
                >
                  Get Started
                  <FiArrowRight className="text-lg transition-transform duration-200 group-hover:translate-x-1" />
                </button>

                <p className="mt-5 text-xs text-gray-400">
                  Set up your restaurant in a few simple steps.
                </p>
              </div>
            </div>
          </div>

        ) : (

          /* Restaurant Dashboard */
          <div className="space-y-8">

            {/* Welcome Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
                  Owner Dashboard
                </p>

                <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                  Welcome to {myShopData.name}
                </h1>

                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                  Manage your restaurant and food items in one place.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/create-edit-shop")}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:self-auto"
              >
                <FaPen className="text-sm" />
                Edit Restaurant
              </button>
            </div>

            {/* Restaurant Details */}
            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:shadow-lg">
              <div className="h-2 bg-gradient-to-r from-red-500 to-orange-400" />

              <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-8">

                <div className="h-48 w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-40 sm:w-48">
                  {myShopData.image ? (
                    <img
                      src={myShopData.image}
                      alt={myShopData.name || "Restaurant"}
                      className="h-full w-full object-cover transition duration-500 hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <FaUtensils className="text-5xl" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Restaurant Profile
                  </span>

                  <h2 className="mt-3 break-words text-2xl font-bold text-gray-900">
                    {myShopData.name}
                  </h2>

                  <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-gray-500">
                    <FiMapPin className="mt-1 shrink-0 text-lg text-red-500" />
                    <span>
                      {[myShopData.address, myShopData.city, myShopData.state]
                        .filter(Boolean)
                        .join(", ") || "Address not available"}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-5 py-4 sm:min-w-36 sm:flex-col sm:items-center sm:justify-center">
                  <FiPackage className="text-2xl text-orange-500" />
                  <div className="sm:text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {shopItems.length}
                    </p>
                    <p className="text-xs font-medium text-gray-500">
                      Food Items
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Food Items Section */}
            <div>
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Your Food Items
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage the dishes available in your restaurant.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/add-food")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 font-semibold text-white shadow-md shadow-red-100 transition duration-200 hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-200"
                >
                  <FaPlus />
                  Add Food Item
                </button>
              </div>

              {shopItems.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-5 py-12 text-center transition duration-300 hover:border-red-200 hover:bg-red-50/30 sm:py-16">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 transition duration-300 hover:rotate-6 hover:scale-110">
                    <FaUtensils className="text-3xl" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-gray-800">
                    No food items yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                    Add your first dish and start building your
                    restaurant's menu.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/add-food")}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 font-semibold text-white transition duration-200 hover:-translate-y-1 hover:bg-red-500"
                  >
                    Add Your First Item
                    <FiArrowRight />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                  {shopItems.map((item, index) => (
                    <div
                      key={item._id || item.id || index}
                      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="h-48 overflow-hidden bg-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name || "Food item"}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            <FaUtensils className="text-4xl" />
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="truncate text-lg font-bold text-gray-900">
                          {item.name || "Untitled Food Item"}
                        </h3>

                        {item.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                            {item.description}
                          </p>
                        )}

                        {item.price != null && (
                          <p className="mt-3 text-lg font-bold text-red-500">
                            ₹{item.price}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  )
}

export default OwnerDashboard