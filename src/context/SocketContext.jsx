import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { API_BASE_URL } from "../../api";

const SocketContext = createContext();

// Provider component that initializes and provides the socket connection
export const SocketProvider = ({ children, userId }) => {
  const [socket, setSocket] = useState(null); 

  useEffect(() => {
    if (userId) {
      const newSocket = io(`${API_BASE_URL}`, { autoConnect: false }); // Create a socket instance without auto-connecting
      newSocket.connect(); // Manually connect the socket
      newSocket.emit("register", userId); // Register the user on the server with their ID
      setSocket(newSocket); // Save the socket instance in state

      // Cleanup function to disconnect the socket when the component unmounts or userId changes
      return () => {
        newSocket.disconnect();
      };
    }
  }, [userId]);

  // Provide the socket instance to all children components via context
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
