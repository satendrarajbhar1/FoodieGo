import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { serverUrl } from "../App";
import { setShopsInMyCity, setShopsFallback } from "../redux/userSlice";

function useGetShopsByCity() {
  const dispatch = useDispatch();
  const { userData, authLoading, currentCity, currentState, currentLocation } =
    useSelector((state) => state.user);

  const lat = currentLocation?.lat;
  const lng = currentLocation?.lng;

  // guest + user = customer
  const isCustomer = !userData || userData.role === "user";

  useEffect(() => {
    if (authLoading) return;

    // Owner / delivery boy ko ye list nahi chahiye
    if (!isCustomer) {
      dispatch(setShopsInMyCity([]));
      dispatch(setShopsFallback(false));
      return;
    }

    let cancelled = false;

    const fetchShops = async () => {
      let shops = [];
      let fallback = false;

      // 1) Location/city mili ho to pehle nearby try karo
      if (currentCity || lat != null) {
        try {
          const result = await axios.get(`${serverUrl}/api/shop/get-by-city`, {
            params: { city: currentCity, state: currentState, lat, lng },
            withCredentials: true,
          });

          shops = result.data.shops || [];
        } catch (error) {
          console.log("Get nearby shops error:", error.response?.data || error);
        }
      }

      // 2) Nearby kuch nahi (ya location hi nahi) -> saari registered shops
      if (shops.length === 0) {
        try {
          const result = await axios.get(`${serverUrl}/api/shop/get-all`, {
            withCredentials: true,
          });

          shops = result.data.shops || [];
          fallback = shops.length > 0;
        } catch (error) {
          console.log("Get all shops error:", error.response?.data || error);
        }
      }

      if (!cancelled) {
        dispatch(setShopsInMyCity(shops));
        dispatch(setShopsFallback(fallback));
      }
    };

    fetchShops();

    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    authLoading,
    isCustomer,
    userData?._id,
    currentCity,
    currentState,
    lat,
    lng,
  ]);

  return null;
}

export default useGetShopsByCity;