import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { serverUrl } from "../App";
import { setShopsInMyCity } from "../redux/userSlice";

function useGetShopsByCity() {
  const dispatch = useDispatch();
  const { userData, currentCity, currentState, currentLocation } = useSelector(
    (state) => state.user
  );

  const lat = currentLocation?.lat;
  const lng = currentLocation?.lng;

  useEffect(() => {
    // Sirf customer ko restaurants chahiye, aur location ya city honi chahiye
    if (!userData || userData.role !== "user" || (!currentCity && lat == null)) {
      dispatch(setShopsInMyCity([]));
      return;
    }

    let cancelled = false;

    const fetchShops = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/shop/get-by-city`, {
          params: { city: currentCity, state: currentState, lat, lng },
          withCredentials: true,
        });

        if (!cancelled) {
          dispatch(setShopsInMyCity(result.data.shops || []));
        }
      } catch (error) {
        if (!cancelled) {
          console.log("Get shops error:", error.response?.data || error);
          dispatch(setShopsInMyCity([]));
        }
      }
    };

    fetchShops();

    return () => {
      cancelled = true;
    };
  }, [dispatch, userData?._id, userData?.role, currentCity, currentState, lat, lng]);

  return null;
}

export default useGetShopsByCity;