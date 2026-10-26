import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    authLoading: true, 
    currentCity: null,
    currentState: null,
    currentAddress: null,
    currentLocation: null, 
    shopsInMyCity: [],
    shopsFallback: false, 
  },

  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
    },

    setAuthLoading: (state, action) => {
      state.authLoading = action.payload;
    },

    setCurrentCity: (state, action) => {
      state.currentCity = action.payload;
    },

    setCurrentState: (state, action) => {
      state.currentState = action.payload;
    },

    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload;
    },

    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },

    setShopsInMyCity: (state, action) => {
      state.shopsInMyCity = action.payload;
    },

    setShopsFallback: (state, action) => {
      state.shopsFallback = action.payload;
    },
  },
});

export const {
  setUserData,
  setAuthLoading,
  setCurrentCity,
  setCurrentState,
  setCurrentAddress,
  setCurrentLocation,
  setShopsInMyCity,
  setShopsFallback,
} = userSlice.actions;

export default userSlice.reducer;