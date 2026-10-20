import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaUtensils } from "react-icons/fa6";
import { FiMapPin } from "react-icons/fi";
import Nav from "./Nav";

function UserDashboard() {
  const navigate = useNavigate();
  const { currentCity, currentLocation, shopsInMyCity } = useSelector(
    (state) => state.user
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <Nav />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Inspiration for your first order
          </h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <FiMapPin className="text-red-500" />
            {currentCity || currentLocation
              ? "Restaurants near you"
              : "Detecting your location..."}
          </p>
        </div>

        {!currentCity && !currentLocation ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
            Please allow location access to see restaurants near you.
          </div>
        ) : shopsInMyCity.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <FaUtensils className="text-3xl" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-gray-800">
              No restaurants found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Abhi aapke paas koi restaurant available nahi hai.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shopsInMyCity.map((shop) => (
              <div
                key={shop._id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/shop/${shop._id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/shop/${shop._id}`);
                }}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-200"
              >
                <div className="h-44 overflow-hidden bg-gray-100">
                  {shop.image ? (
                    <img
                      src={shop.image}
                      alt={shop.name}
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
                    {shop.name}
                  </h3>

                  <p className="mt-2 flex items-start gap-2 text-sm text-gray-500">
                    <FiMapPin className="mt-0.5 shrink-0 text-red-500" />
                    <span className="line-clamp-2">
                      {[shop.address, shop.city, shop.state]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </p>

                  <p className="mt-3 text-xs font-semibold text-red-500">
                    {shop.items?.length || 0} food items
                    {shop.distanceKm != null && ` • ${shop.distanceKm} km away`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default UserDashboard;