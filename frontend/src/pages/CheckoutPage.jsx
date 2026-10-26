import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { FiMapPin } from "react-icons/fi";
import { serverUrl } from "../App";
import Nav from "../components/Nav";
import { clearCart } from "../redux/cartSlice";

// Backend me bhi 40 hai. Asli total hamesha backend se aata hai.
const DELIVERY_FEE = 40;

// Razorpay checkout script ek hi baar load hoti hai
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cart = useSelector((state) => state.cart);
  const { userData, currentAddress } = useSelector((state) => state.user);

  const [address, setAddress] = useState(currentAddress || "");
  const [addressEdited, setAddressEdited] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Location late aaye to auto-fill, lekin user ne edit kiya ho to mat badlo
  useEffect(() => {
    if (!addressEdited && currentAddress) {
      setAddress(currentAddress);
    }
  }, [currentAddress, addressEdited]);

  if (userData && userData.role !== "user") {
    return <Navigate to="/" replace />;
  }

  if (cart.items.length === 0 && !loading) {
    return <Navigate to="/cart" replace />;
  }

  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  const goToOrders = () => {
    dispatch(clearCart());
    navigate("/my-orders", {
      replace: true,
      state: { justPlaced: true },
    });
  };

  const startOnlinePayment = async (data) => {
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      setError("Could not load the payment window. Check your internet.");
      setLoading(false);
      return;
    }

    const { order, razorpay } = data;

    const options = {
      key: razorpay.keyId,
      amount: razorpay.amount,
      currency: razorpay.currency,
      order_id: razorpay.orderId,
      name: "FoodieGo",
      description: `Order from ${cart.shopName}`,
      prefill: {
        name: userData?.fullName || "",
        email: userData?.email || "",
        contact: userData?.mobile || "",
      },
      theme: { color: "#ef4444" },

      // Payment ho gaya -> backend se signature verify karwao
      handler: async (response) => {
        try {
          await axios.post(
            `${serverUrl}/api/order/verify-payment`,
            {
              orderId: order._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            { withCredentials: true }
          );

          goToOrders();
        } catch (err) {
          console.error("VERIFY PAYMENT ERROR:", err);
          setError(
            (err.response?.data?.message ||
              "Payment verification failed.") +
              " Agar paise kat gaye hain to support se contact karo."
          );
          setLoading(false);
        }
      },

      modal: {
        // User ne popup band kar diya
        ondismiss: () => {
          setError("Payment cancelled. Aap dobara try kar sakte ho.");
          setLoading(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", (response) => {
      console.error("PAYMENT FAILED:", response.error);
      setError(response.error?.description || "Payment failed. Try again.");
      setLoading(false);
    });

    rzp.open();
  };

  const handlePlaceOrder = async () => {
    if (loading) return;
    setError("");

    if (!address.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    try {
      setLoading(true);

      const result = await axios.post(
        `${serverUrl}/api/order/place-order`,
        {
          shopId: cart.shopId,
          items: cart.items.map((i) => ({
            itemId: i._id,
            quantity: i.quantity,
          })),
          deliveryAddress: { text: address.trim() },
          paymentMethod,
        },
        { withCredentials: true }
      );

      if (result.status !== 201) return;

      if (paymentMethod === "cod") {
        goToOrders();
        return;
      }

      // Online: popup kholo (loading tab tak true rahega jab tak payment complete na ho)
      await startOnlinePayment(result.data);
    } catch (err) {
      console.error("PLACE ORDER ERROR:", err);
      setError(
        err.response?.data?.message ||
          "Order could not be placed. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <Nav />

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <button
          type="button"
          onClick={() => navigate("/cart")}
          className="mb-5 text-sm font-semibold text-gray-600 transition hover:text-red-500"
        >
          ← Back to Cart
        </button>

        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Checkout
        </h1>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-6 space-y-5">
          {/* Address */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <FiMapPin className="text-red-500" />
              Delivery Address
            </h2>

            <textarea
              rows={3}
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setAddressEdited(true);
              }}
              placeholder="House no, street, area, landmark..."
              className="mt-3 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />

            <p className="mt-2 text-xs text-gray-500">
              Ye address aapki detected location se bhara gaya hai. Aap edit
              kar sakte ho.
            </p>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>

            <div className="mt-3 space-y-3">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                  paymentMethod === "cod"
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="accent-red-500"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    Cash on Delivery
                  </p>
                  <p className="text-xs text-gray-500">
                    Order milne par cash ya UPI se pay karo.
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                  paymentMethod === "online"
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                  className="accent-red-500"
                />
                <div>
                  <p className="font-semibold text-gray-900">Pay Online</p>
                  <p className="text-xs text-gray-500">
                    UPI, Card, Netbanking (Razorpay)
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Summary */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
            <p className="mt-1 text-sm text-gray-500">From {cart.shopName}</p>

            <div className="mt-4 space-y-2 text-sm text-gray-700">
              {cart.items.map((item) => (
                <div key={item._id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="shrink-0">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery fee</span>
                <span>₹{DELIVERY_FEE}</span>
              </div>
              <div className="flex justify-between pt-2 text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-red-500 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? paymentMethod === "online"
                  ? "Processing payment..."
                  : "Placing order..."
                : paymentMethod === "online"
                ? `Pay Now • ₹${total}`
                : `Place Order • ₹${total}`}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;