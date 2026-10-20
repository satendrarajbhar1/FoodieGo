import { useEffect } from "react";
import { useSelector } from "react-redux";
import { getSocket } from "../socket";

function useSocket() {
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    const socket = getSocket();

    if (userData?._id) {
      socket.connect();
    } else {
      socket.disconnect();
    }
  }, [userData?._id]);
}

export default useSocket;