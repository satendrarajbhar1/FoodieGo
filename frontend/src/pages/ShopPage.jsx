import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { FaUtensils } from "react-icons/fa6";
import { FiMapPin, FiShoppingCart } from "react-icons/fi";
import { serverUrl } from "../App";
import Nav from "../components/Nav";
import {
  addToCart,
  clearCart,
  decreaseQty,
  increaseQty,
} from "../redux/cartSlice";

const ShopPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cart = useSelector((state) => state.cart);

  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    let cancelled = false;

    const fetchShop = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await axios.get(
          `${serverUrl}/api/shop/get-by-id/${shopId}`,
          { withCredentials: true }
        );

        if (!cancelled) {
          setShop(result.data.shop);
          setActiveCategory("All");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load restaurant.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchShop();

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  const items = shop?.items || [];

  const categories = [
    "All",
    ...new Set(items.map((item) => item.category).filter(Boolean)),
  ];

  const visibleItems =
    activeCategory === "All"
      ? items
      : items.filter((item) => item.category === activeCategory);

  const getQty = (itemId) =>
    cart.items.find((i) => i._id === itemId)?.quantity || 0;

  const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  const handleAdd = (item) => {
    // Cart me dusre restaurant ke items hain to pehle poocho
    if (cart.shopId && cart.shopId !== shop._id) {
      const ok = window.confirm(
        `Aapke cart me "${cart.shopName}" ke items hain. Cart clear karke "${shop.name}" ka item add karein?`
      );

      if (!ok) return;
      dispatch(clearCart());
    }

    dispatch(
      addToCart({
        item,
        shop: { _id: shop._id, name: shop.name },
      })
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 pb-24">
      <Nav />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-5 text-sm font-semibold text-gray-600 transition hover:text-red-500"
        >
          ← Back to Restaurants
        </button>

        {loading && (
          <p className="py-16 text-center text-sm text-gray-500">Loading...</p>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {!loading && !error && shop && (
          <div className="space-y-8">
            {/* Shop Header */}
            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="h-2 bg-gradient-to-r from-red-500 to-orange-400" />

              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-8">
                <div className="h-48 w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-36 sm:w-48">
                  {shop.image ? (
                    <img
                      src={shop.image}
                      alt={shop.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <FaUtensils className="text-5xl" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="break-words text-2xl font-bold text-gray-900 sm:text-3xl">
                    {shop.name}
                  </h1>

                  <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-gray-500">
                    <FiMapPin className="mt-1 shrink-0 text-lg text-red-500" />
                    <span>
                      {[shop.address, shop.city, shop.state]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </p>

                  <p className="mt-2 text-xs font-semibold text-red-500">
                    {items.length} food items
                  </p>
                </div>
              </div>
            </div>

            {/* Menu */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">
                Menu
              </h2>

              {items.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-5 py-14 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                    <FaUtensils className="text-3xl" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-800">
                    No food items yet
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Is restaurant ne abhi koi item add nahi kiya hai.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                          activeCategory === category
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:border-red-300"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleItems.map((item) => {
                      const qty = getQty(item._id);

                      return (
                        <div
                          key={item._id}
                          className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                          <div className="h-44 overflow-hidden bg-gray-100">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-gray-400">
                                <FaUtensils className="text-4xl" />
                              </div>
                            )}
                          </div>

                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="truncate text-lg font-bold text-gray-900">
                                {item.name}
                              </h3>

                              <span
                                title={
                                  item.FoodType === "veg" ? "Veg" : "Non-Veg"
                                }
                                className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${
                                  item.FoodType === "veg"
                                    ? "bg-green-500"
                                    : "bg-red-600"
                                }`}
                              />
                            </div>

                            <p className="mt-1 text-xs text-gray-500">
                              {item.category}
                            </p>

                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-lg font-bold text-red-500">
                                ₹{item.price}
                              </p>

                              {qty === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleAdd(item)}
                                  className="rounded-full bg-red-500 px-5 py-1.5 text-sm font-semibold text-white transition hover:bg-red-600"
                                >
                                  Add
                                </button>
                              ) : (
                                <div className="flex items-center gap-3 rounded-full border border-red-200 bg-red-50 px-2 py-1">
                                  <button
                                    type="button"
                                    onClick={() => dispatch(decreaseQty(item._id))}
                                    className="h-7 w-7 rounded-full text-lg font-bold text-red-600 transition hover:bg-red-100"
                                  >
                                    −
                                  </button>

                                  <span className="min-w-4 text-center text-sm font-semibold text-gray-800">
                                    {qty}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => dispatch(increaseQty(item._id))}
                                    className="h-7 w-7 rounded-full text-lg font-bold text-red-600 transition hover:bg-red-100"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Neeche floating "View Cart" bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="mx-auto flex w-full max-w-xl items-center justify-between rounded-2xl bg-red-500 px-5 py-3.5 font-semibold text-white shadow-lg transition hover:bg-red-600"
          >
            <span className="flex items-center gap-2">
              <FiShoppingCart className="text-lg" />
              {cartCount} item{cartCount > 1 ? "s" : ""}
            </span>
            <span>View Cart →</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopPage;