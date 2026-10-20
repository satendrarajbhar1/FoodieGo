import { useEffect, useRef } from "react";
import { getSocket } from "../socket";

// Kisi bhi socket event par handler chalao (component unmount par apne aap hat jata hai)
function useOrderEvents(eventName, handler) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const socket = getSocket();
    const listener = (payload) => handlerRef.current(payload);

    socket.on(eventName, listener);

    return () => {
      socket.off(eventName, listener);
    };
  }, [eventName]);
}

export default useOrderEvents;