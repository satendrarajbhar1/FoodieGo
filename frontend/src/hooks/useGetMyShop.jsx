import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { serverUrl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";

function useGetMyShop() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    // Login nahi hai ya owner nahi hai -> shop data clear
    if (!userData || userData.role !== "owner") {
      dispatch(setMyShopData(null));
      return;
    }

    let cancelled = false;

    const fetchShop = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/shop/get-shop`, {
          withCredentials: true,
        });

        if (!cancelled) {
          dispatch(setMyShopData(result.data));
        }
      } catch (error) {
        if (cancelled) return;

        // 404 matlab abhi shop bana hi nahi, ye normal hai
        if (error.response?.status === 404) {
          dispatch(setMyShopData(null));
        } else {
          console.log(
            "Get shop error:",
            error.response?.status,
            error.response?.data
          );
        }
      }
    };

    fetchShop();

    return () => {
      cancelled = true;
    };
  }, [dispatch, userData?._id, userData?.role]);

  return null;
}

export default useGetMyShop;