import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  setCurrentAddress,
  setCurrentCity,
  setCurrentLocation,
  setCurrentState,
} from "../redux/userSlice";

function useGetCity() {
  const dispatch = useDispatch();
  const apiKey = import.meta.env.VITE_GEOAPIKEY;

  // Guest ho ya logged-in, app khulte hi ek baar location detect karo
  useEffect(() => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Pehle coordinates save karo (geocoding fail ho tab bhi kaam aayenge)
        dispatch(setCurrentLocation({ lat: latitude, lng: longitude }));

        try {
          const result = await axios.get(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`
          );

          const place = result?.data?.results?.[0];
          if (!place) return;

          const city = place.city || place.town || place.village || place.county;

          dispatch(setCurrentCity(city || null));
          dispatch(setCurrentState(place.state || null));
          dispatch(setCurrentAddress(place.address_line2 || null));
        } catch (error) {
          console.log("Get city error:", error);
        }
      },
      (error) => {
       
        console.log("Location permission error:", error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, [dispatch, apiKey]);
}

export default useGetCity;