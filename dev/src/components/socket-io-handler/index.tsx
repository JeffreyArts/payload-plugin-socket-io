import React, { useState, useEffect } from 'react';
import { socket } from './../socket';
import { ConnectionState } from './ConnectionState';
import { ConnectionManager } from './ConnectionManager';
import { Events } from "./Events";
import { MyForm } from './MyForm';
import "./index.scss"
// As this is the demo project, we import our dependencies from the `src` directory.

// In your projects, you can import as follows:
// import { useConfig } from 'payload/components/utilities';


const SocketIOHandler: React.FC = () => {

  const [socketId] = useState(socket.id);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [fooEvents, setFooEvents] = useState([]);

  socket.onAny((param, event) => {
    console.log(param, event)
  })

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onFooEvent(value) {
      setFooEvents(previous => [...previous, value]);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('foo', onFooEvent);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('foo', onFooEvent);
    };
  }, []);

  return (
    <div className="App">
      <ConnectionState id={ socketId } />
      <Events events={ fooEvents } />
      
      <MyForm />
    </div>
  );
}

export default SocketIOHandler