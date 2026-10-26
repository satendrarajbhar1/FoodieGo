import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { serverUrl } from "../App";
import { setUserData, setAuthLoading } from "../redux/userSlice";

function useGetCurrentUser() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/user/current`, {
          withCredentials: true,
        });

        dispatch(setUserData(result.data));
      } catch (error) {
       
        dispatch(setUserData(null));
      } finally {
        dispatch(setAuthLoading(false));
      }
    };

    fetchUser();
  }, [dispatch]);
}

export default useGetCurrentUser;