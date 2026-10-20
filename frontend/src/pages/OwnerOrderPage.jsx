import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUtensils } from "react-icons/fa6";
import { serverUrl } from "../App";
import Nav from "../components/Nav";
import useOrderEvents from "../hooks/useOrderEvents";

const STATUS_LABELS = {
  placed: { text: "New Order", style: "bg-blue-50 text-blue-700" },
  accepted: { text: "Accepted", style: "bg-indigo-50 text-indigo-700" },
  preparing: { text: "Preparing", style: "bg-orange-50 text-orange-700" },
  out_for_delivery: {
    text: "Out for Delivery",
    style: "bg-purple-50 text-purple-700",
  },
  delivered: { text: "Delivered", style: "bg-green-50 text-green-700" },
  cancelled: { text: "Cancelled", style: "bg-red-50 text-red-700" },
};

// Owner ke buttons. Pickup aur delivery ab delivery boy karta hai.
const ACTIONS = {
  placed: [
    { label: "Accept", to: "accepted", primary: true },
    { label: "Reject", to: "cancelled", danger: true },
  ],
  accepted: [
    { label: "Start Preparing", to: "preparing", primary: true },
    { label: "Cancel", to: "cancelled", danger: true },
  ],
};

const HINTS = {
  preparing: "Waiting for the delivery partner to pick up.",
  out_for_delivery: "Delivery partner is on the way.",
};

const ACTIVE_STATUSES = ["placed", "accepted", "preparing", "out_for_delivery"];

const OwnerOrdersPage = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("active");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/shop-orders`, {
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

  // Live updates (polling ki jagah)
  useOrderEvents("order-event", (payload) => {
    if (payload?.message) setNotice(payload.message);
    fetchOrders();
  });

  useOrderEvents("connect", fetchOrders);

  const handleUpdate = async (order, action) => {
    if (updatingId) return;

    if (action.danger) {
      const ok = window.confirm(`Is order ko "${action.label}" karna hai?`);
      if (!ok) return;
    }

    try {
      setUpdatingId(order._id);

      const result = await axios.patch(
        `${serverUrl}/api/order/update-status/${order._id}`,
        { status: action.to },
        { withCredentials: true }
      );

      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? result.data.order : o))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Could not update the order.");
      fetchOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const historyOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));
  const visibleOrders = tab === "active" ? activeOrders : historyOrders;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <Nav />

      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-5 text-sm font-semibold text-gray-600 transition hover:text-red-500"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Restaurant Orders
        </h1>

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

        <div className="mt-5 flex gap-2">
          {[
            { key: "active", label: `Active (${activeOrders.length})` },
            { key: "history", label: `History (${historyOrders.length})` },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                tab === t.key
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-red-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

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

        {!loading && !error && visibleOrders.length === 0 && (
          <div className="mt-6 rounded-3xl border-2 border-dashed border-gray-200 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <FaUtensils className="text-3xl" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-gray-800">
              {tab === "active" ? "No active orders" : "No past orders"}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Naye orders yaha apne aap dikhenge.
            </p>
          </div>
        )}

        {!loading && !error && visibleOrders.length > 0 && (
          <div className="mt-6 space-y-4">
            {visibleOrders.map((order) => {
              const status = STATUS_LABELS[order.status] || {
                text: order.status,
                style: "bg-gray-100 text-gray-700",
              };
              const actions = ACTIONS[order.status] || [];
              const busy = updatingId === order._id;

              return (
                <div
                  key={order._id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-gray-900">
                        {order.user?.fullName || "Customer"}
                      </h3>
                      {order.user?.mobile && (
                        <a
                          href={`tel:${order.user.mobile}`}
                          className="text-sm text-gray-600 hover:text-red-500"
                        >
                          {order.user.mobile}
                        </a>
                      )}
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

                  <p className="mt-3 text-xs text-gray-500">
                    Deliver to: {order.deliveryAddress?.text}
                  </p>

                  {order.deliveryBoy && (
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

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900">
                        ₹{order.totalAmount}
                      </span>
                      <span className="ml-2 text-gray-500">
                        {order.paymentMethod === "cod"
                          ? "Cash on Delivery"
                          : "Paid Online"}
                        {" • "}
                        {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                      </span>
                    </div>

                    {actions.length > 0 ? (
                      <div className="flex gap-2">
                        {actions.map((action) => (
                          <button
                            key={action.to}
                            type="button"
                            disabled={busy}
                            onClick={() => handleUpdate(order, action)}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              action.primary
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "border border-gray-200 bg-white text-red-500 hover:bg-red-50"
                            }`}
                          >
                            {busy ? "Updating..." : action.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      HINTS[order.status] && (
                        <p className="text-xs font-medium text-gray-500">
                          {HINTS[order.status]}
                        </p>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default OwnerOrdersPage;