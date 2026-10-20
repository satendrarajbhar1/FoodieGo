import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaUtensils } from "react-icons/fa6";
import Nav from "../components/Nav";
import {
  clearCart,
  decreaseQty,
  increaseQty,
  removeFromCart,
} from "../redux/cartSlice";

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <Nav />

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 text-sm font-semibold text-gray-600 transition hover:text-red-500"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Your Cart
        </h1>

        {cart.items.length === 0 ? (
          <div className="mt-6 rounded-3xl border-2 border-dashed border-gray-200 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <FaUtensils className="text-3xl" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-gray-800">
              Your cart is empty
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Kisi restaurant se kuch tasty add karo.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 rounded-full bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600"
            >
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                From{" "}
                <span
                  onClick={() => navigate(`/shop/${cart.shopId}`)}
                  className="cursor-pointer font-semibold text-gray-800 hover:text-red-500"
                >
                  {cart.shopName}
                </span>
              </p>

              <button
                type="button"
                onClick={() => dispatch(clearCart())}
                className="text-sm font-semibold text-red-500 hover:underline"
              >
                Clear cart
              </button>
            </div>

            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
              {cart.items.map((item) => (
                <div key={item._id} className="flex items-center gap-4 p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <FaUtensils />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">₹{item.price} each</p>

                    <button
                      type="button"
                      onClick={() => dispatch(removeFromCart(item._id))}
                      className="mt-1 text-xs font-semibold text-gray-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3 rounded-full border border-red-200 bg-red-50 px-2 py-1">
                      <button
                        type="button"
                        onClick={() => dispatch(decreaseQty(item._id))}
                        className="h-7 w-7 rounded-full text-lg font-bold text-red-600 transition hover:bg-red-100"
                      >
                        −
                      </button>

                      <span className="min-w-4 text-center text-sm font-semibold text-gray-800">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => dispatch(increaseQty(item._id))}
                        className="h-7 w-7 rounded-full text-lg font-bold text-red-600 transition hover:bg-red-100"
                      >
                        +
                      </button>
                    </div>

                    <p className="text-sm font-bold text-gray-900">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>₹{total}</span>
              </div>

              {/* Phase 2 me ye checkout page par jayega */}
                           <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="mt-5 w-full rounded-xl bg-red-500 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-red-600"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CartPage;