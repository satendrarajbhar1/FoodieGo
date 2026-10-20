import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    currentLocation: null, // { lat, lng }
    shopsInMyCity: [],
  },

  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
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
  },
});

export const {
  setUserData,
  setCurrentCity,
  setCurrentState,
  setCurrentAddress,
  setCurrentLocation,
  setShopsInMyCity,
} = userSlice.actions;

export default userSlice.reducer;