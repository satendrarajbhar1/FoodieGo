import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUtensils } from "react-icons/fa6";
import { serverUrl } from "../App";
import Nav from "../components/Nav";
import useOrderEvents from "../hooks/useOrderEvents";

const STATUS_LABELS = {
  placed: { text: "Order Placed", style: "bg-blue-50 text-blue-700" },
  accepted: { text: "Accepted", style: "bg-indigo-50 text-indigo-700" },
  preparing: { text: "Preparing", style: "bg-orange-50 text-orange-700" },
  out_for_delivery: {
    text: "Out for Delivery",
    style: "bg-purple-50 text-purple-700",
  },
  delivered: { text: "Delivered", style: "bg-green-50 text-green-700" },
  cancelled: { text: "Cancelled", style: "bg-red-50 text-red-700" },
};

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const justPlaced = location.state?.justPlaced;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/my-orders`, {
        withCredentials: true,
      });

      setOrders(result.data.orders || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Live status updates (polling ki jagah)
  useOrderEvents("order-event", (payload) => {
    if (payload?.message) setNotice(payload.message);
    fetchOrders();
  });

  useOrderEvents("connect", fetchOrders);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <Nav />

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          My Orders
        </h1>

        {justPlaced && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
            Your order has been placed successfully!
          </div>
        )}

        {notice && (
          <div className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-700">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="shrink-0 text-blue-400 hover:text-blue-700"
            >
              ✕
            </button>
          </div>
        )}

        {loading && (
          <p className="py-16 text-center text-sm text-gray-500">Loading...</p>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-6 rounded-3xl border-2 border-dashed border-gray-200 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <FaUtensils className="text-3xl" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-gray-800">
              No orders yet
            </h3>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 rounded-full bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600"
            >
              Browse Restaurants
            </button>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const status = STATUS_LABELS[order.status] || {
                text: order.status,
                style: "bg-gray-100 text-gray-700",
              };

              return (
                <div
                  key={order._id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-gray-900">
                        {order.shop?.name || "Restaurant"}
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.style}`}
                    >
                      {status.text}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-gray-700">
                    {order.items.map((item) => (
                      <div
                        key={item.item}
                        className="flex justify-between gap-3"
                      >
                        <span className="min-w-0 truncate">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="shrink-0">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
                    <span className="text-gray-500">
                      {order.paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : "Paid Online"}
                      {" • "}
                      {order.paymentStatus === "paid" ? "Paid" : "Payment pending"}
                    </span>
                    <span className="text-base font-bold text-gray-900">
                      ₹{order.totalAmount}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    Deliver to: {order.deliveryAddress?.text}
                  </p>

                  {order.deliveryBoy && order.status !== "cancelled" && (
                    <p className="mt-1 text-xs font-medium text-gray-700">
                      Delivery partner: {order.deliveryBoy.fullName} •{" "}
                      <a
                        href={`tel:${order.deliveryBoy.mobile}`}
                        className="hover:text-red-500"
                      >
                        {order.deliveryBoy.mobile}
                      </a>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrdersPage;