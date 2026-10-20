import { createSlice } from "@reduxjs/toolkit";

const CART_KEY = "tomato_cart";

const emptyCart = { shopId: null, shopName: "", items: [] };

const loadCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : emptyCart;
  } catch {
    return emptyCart;
  }
};

const cartSlice = createSlice({
  name: "cart",
  initialState: loadCart(),

  reducers: {
    // payload: { item, shop }
    addToCart: (state, action) => {
      const { item, shop } = action.payload;

      // Cart me ek hi restaurant ke items allowed hain
      if (state.shopId && state.shopId !== shop._id) return;

      state.shopId = shop._id;
      state.shopName = shop.name;

      const existing = state.items.find((i) => i._id === item._id);

      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({
          _id: item._id,
          name: item.name,
          price: item.price,
          image: item.image,
          FoodType: item.FoodType,
          quantity: 1,
        });
      }
    },

    increaseQty: (state, action) => {
      const item = state.items.find((i) => i._id === action.payload);
      if (item) item.quantity += 1;
    },

    decreaseQty: (state, action) => {
      const item = state.items.find((i) => i._id === action.payload);
      if (!item) return;

      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        state.items = state.items.filter((i) => i._id !== action.payload);
      }

      if (state.items.length === 0) {
        state.shopId = null;
        state.shopName = "";
      }
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i._id !== action.payload);

      if (state.items.length === 0) {
        state.shopId = null;
        state.shopName = "";
      }
    },

    clearCart: () => emptyCart,
  },
});

export const {
  addToCart,
  increaseQty,
  decreaseQty,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;