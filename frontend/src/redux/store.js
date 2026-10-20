import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice";
import ownerSlice from "./ownerSlice";
import cartSlice from "./cartSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    owner: ownerSlice,
    cart: cartSlice,
  },
});

// Cart har change par localStorage me save hoga
store.subscribe(() => {
  try {
    localStorage.setItem("tomato_cart", JSON.stringify(store.getState().cart));
  } catch {
    // storage full ya blocked ho to ignore
  }
});