import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { FaUtensils } from "react-icons/fa6";
import { FiMapPin, FiPhone } from "react-icons/fi";
import { serverUrl } from "../App";
import Nav from "./Nav";
import useOrderEvents from "../hooks/useOrderEvents";

// Browser se current location
const getPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Please allow location access to go online.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  });

function DeliveryBoy() {
  const [data, setData] = useState({
    isAvailable: false,
    currentOrder: null,
    availableOrders: [],
    deliveredCount: 0,
    radiusKm: 5,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/delivery/overview`, {
        withCredentials: true,
      });

      setData(result.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Online rehte hue location bhejte raho (turant ek baar, phir har 30 second)
  useEffect(() => {
    if (!data.isAvailable) return;

    const sendLocation = async () => {
      try {
        const pos = await getPosition();

        await axios.patch(`${serverUrl}/api/delivery/location`, pos, {
          withCredentials: true,
        });

        return true;
      } catch {
        // Location na mile to chup rehne do, agli baar try hoga
        return false;
      }
    };

    sendLocation().then((ok) => {
      if (ok) fetchOverview();
    });

    const timer = setInterval(sendLocation, 30000);

    return () => clearInterval(timer);
  }, [data.isAvailable, fetchOverview]);

  useOrderEvents("delivery-event", (payload) => {
    if (payload?.message) setNotice(payload.message);
    fetchOverview();
  });

  useOrderEvents("connect", fetchOverview);

  const toggleOnline = async () => {
    if (busy) return;

    try {
      setBusy(true);

      let body = { isAvailable: !data.isAvailable };

      // Online jaane ke liye location zaroori hai
      if (body.isAvailable) {
        const pos = await getPosition();
        body = { ...body, ...pos };
      }

      await axios.patch(`${serverUrl}/api/delivery/availability`, body, {
        withCredentials: true,
      });

      await fetchOverview();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.message ||
          "Could not change your status."
      );
    } finally {
      setBusy(false);
    }
  };

  const acceptOrder = async (orderId) => {
    if (busy) return;

    try {
      setBusy(true);

      await axios.post(
        `${serverUrl}/api/delivery/accept/${orderId}`,
        {},
        { withCredentials: true }
      );

      setNotice("");
    } catch (err) {
      alert(err.response?.data?.message || "Could not accept the order.");
    } finally {
      await fetchOverview();
      setBusy(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    if (busy) return;

    try {
      setBusy(true);

      await axios.patch(
        `${serverUrl}/api/delivery/update-status/${orderId}`,
        { status },
        { withCredentials: true }
      );
    } catch (err) {
      alert(err.response?.data?.message || "Could not update the order.");
    } finally {
      await fetchOverview();
      setBusy(false);
    }
  };

  const { isAvailable, currentOrder, availableOrders, deliveredCount, radiusKm } =
    data;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <Nav />

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Delivery Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Delivered so far: {deliveredCount}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleOnline}
            disabled={busy}
            className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
              isAvailable
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-400 hover:bg-gray-500"
            }`}
          >
            {isAvailable ? "● Online" : "○ Offline"}
          </button>
        </div>

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

        {!loading && !error && currentOrder && (
          <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
              Current Delivery
            </p>

            <h2 className="mt-2 text-xl font-bold text-gray-900">
              {currentOrder.shop?.name}
            </h2>

            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <p className="flex items-start gap-2">
                <FiMapPin className="mt-0.5 shrink-0 text-red-500" />
                <span>
                  <span className="font-semibold">Pickup: </span>
                  {[currentOrder.shop?.address, currentOrder.shop?.city]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </p>

              <p className="flex items-start gap-2">
                <FiMapPin className="mt-0.5 shrink-0 text-green-600" />
                <span>
                  <span className="font-semibold">Drop: </span>
                  {currentOrder.deliveryAddress?.text}
                </span>
              </p>

              <p className="flex items-center gap-2">
                <FiPhone className="shrink-0 text-gray-500" />
                <a
                  href={`tel:${currentOrder.user?.mobile}`}
                  className="hover:text-red-500"
                >
                  {currentOrder.user?.fullName} • {currentOrder.user?.mobile}
                </a>
              </p>
            </div>

            <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 text-sm text-gray-700">
              {currentOrder.items.map((item) => (
                <div key={item.item} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {item.name} × {item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {currentOrder.paymentMethod === "cod" && (
              <p className="mt-4 rounded-xl bg-orange-50 p-3 text-sm font-semibold text-orange-700">
                Collect ₹{currentOrder.totalAmount} cash from the customer.
              </p>
            )}

            {currentOrder.paymentMethod === "online" && (
              <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">
                Already paid online. Do not collect cash.
              </p>
            )}

            <div className="mt-5">
              {currentOrder.status === "accepted" && (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-xl bg-gray-200 px-5 py-3 font-semibold text-gray-500"
                >
                  Waiting for the restaurant to prepare...
                </button>
              )}

              {currentOrder.status === "preparing" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    updateStatus(currentOrder._id, "out_for_delivery")
                  }
                  className="w-full rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                >
                  Picked Up — Start Delivery
                </button>
              )}

              {currentOrder.status === "out_for_delivery" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updateStatus(currentOrder._id, "delivered")}
                  className="w-full rounded-xl bg-green-500 px-5 py-3 font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          </section>
        )}

        {!loading && !error && !isAvailable && !currentOrder && (
          <div className="mt-6 rounded-3xl border-2 border-dashed border-gray-200 bg-white px-5 py-14 text-center">
            <h3 className="text-lg font-bold text-gray-800">You are offline</h3>
            <p className="mt-2 text-sm text-gray-500">
              Naye delivery requests paane ke liye Online ho jao. Location
              permission allow honi chahiye.
            </p>
          </div>
        )}

        {!loading && !error && isAvailable && !currentOrder && (
          <section className="mt-6">
            <h2 className="text-xl font-bold text-gray-900">
              Available Orders
            </h2>
            <p className="mb-4 mt-1 text-sm text-gray-500">
              Sirf aapke {radiusKm} km ke andar ke restaurants ke orders.
            </p>

            {availableOrders.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-5 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <FaUtensils className="text-3xl" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-800">
                  No orders nearby
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Paas ka naya order aate hi yaha apne aap dikhega.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableOrders.map((order) => (
                  <div
                    key={order._id}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    <h3 className="text-lg font-bold text-gray-900">
                      {order.shop?.name}
                    </h3>

                    <p className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                      <FiMapPin className="mt-0.5 shrink-0 text-red-500" />
                      <span>
                        Pickup:{" "}
                        {[order.shop?.address, order.shop?.city]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </p>

                    <p className="mt-1 flex items-start gap-2 text-sm text-gray-600">
                      <FiMapPin className="mt-0.5 shrink-0 text-green-600" />
                      <span>Drop: {order.deliveryAddress?.text}</span>
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-sm text-gray-500">
                        {order.items.length} item
                        {order.items.length > 1 ? "s" : ""} • ₹
                        {order.totalAmount} •{" "}
                        {order.paymentMethod === "cod" ? "COD" : "Paid"}
                      </span>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => acceptOrder(order._id)}
                        className="rounded-xl bg-red-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default DeliveryBoy;