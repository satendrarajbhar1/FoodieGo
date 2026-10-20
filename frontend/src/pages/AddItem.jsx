import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { serverUrl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";
import Nav from "../components/Nav";

const AddItem = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Snacks");
  const [foodType, setFoodType] = useState("veg");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !category || !foodType || price === "") {
      setError("Please fill all food details.");
      return;
    }

    if (!image) {
      setError("Please select a food image.");
      return;
    }

    if (Number(price) < 0 || !Number.isFinite(Number(price))) {
      setError("Please enter a valid price.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("category", category);
    formData.append("foodType", foodType);
    formData.append("price", price);
    formData.append("image", image);

    try {
      setLoading(true);

      const result = await axios.post(
        `${serverUrl}/api/item/add-item`,
        formData,
        { withCredentials: true }
      );

      if (result.status === 201) {
        // Fetch the updated shop with its populated food items.
        const shopResult = await axios.get(
          `${serverUrl}/api/shop/get-shop`,
          { withCredentials: true }
        );

        // get-shop returns the shop object directly.
        dispatch(setMyShopData(shopResult.data));

        navigate("/");
      }
    } catch (err) {
      console.error("ADD ITEM ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Food item could not be added. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-6 text-sm font-semibold text-gray-600 transition hover:text-red-500"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Add Food Item
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Add a new dish to your restaurant menu.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="foodName"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Food Name
              </label>

              <input
                id="foodName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter food name"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Category
              </label>

              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                {[
                  "Snacks",
                  "Main Course",
                  "Desserts",
                  "Pizza",
                  "Burgers",
                  "Sandwiches",
                  "South Indian",
                  "North Indian",
                  "Chinese",
                  "Fast Food",
                  "Others",
                ].map((itemCategory) => (
                  <option key={itemCategory} value={itemCategory}>
                    {itemCategory}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="foodType"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Food Type
              </label>

              <select
                id="foodType"
                value={foodType}
                onChange={(e) => setFoodType(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-Vegetarian</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="price"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Price (₹)
              </label>

              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div>
              <label
                htmlFor="foodImage"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Food Image
              </label>

              <input
                id="foodImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-red-50 file:px-4 file:py-2 file:font-semibold file:text-red-600 hover:file:bg-red-100"
              />

              {preview && (
                <div className="mt-4">
                  <img
                    src={preview}
                    alt="Food preview"
                    className="h-48 w-full rounded-xl object-cover sm:w-72"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-500 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Adding Food..." : "Add Food Item"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddItem;