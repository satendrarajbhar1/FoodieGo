import axios from 'axios';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { serverUrl } from '../App';
import { setUserData } from '../redux/userSlice';

function useGetCurrentUser() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/user/current`,
          { withCredentials: true }
        );

        dispatch(setUserData(result.data));
      } catch (error) {
        console.log(error); 
      }
    };

    fetchUser();
  }, [dispatch]);

}

export default useGetCurrentUser;