import React, { useState, useEffect } from 'react';
import { socket } from './../socket';
import { ConnectionState } from './ConnectionState';
import { Events } from "./socketEvents";
import { useLocation } from "react-router-dom";

import "./index.scss"
// As this is the demo project, we import our dependencies from the `src` directory.

// In your projects, you can import as follows:
// import { useConfig } from 'payload/components/utilities';

const formatDateTime = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0').slice(0, 2);
  return `${hours}:${minutes}:${seconds}`;
};


const SocketIOHandler: React.FC = () => {
  
  const [socketId] = useState(socket.id);
  const [fooEvents, setFooEvents] = useState([] as any[]);
  const location = useLocation();
  const [currentLocation, setCurrentLocation] = useState( location.pathname.split("/")[3] || location.pathname.split("/")[1]);



  // Tell the server on which page the user currently is
  useEffect(() => {
    socket.emit("manual-room-switch", {enter: currentLocation}) // Custom emit for demo purpose
    const newLocation = location.pathname.split("/")[3] || location.pathname.split("/")[1]
    if (newLocation != currentLocation) {
      setCurrentLocation(location.pathname.split("/")[3] || location.pathname.split("/")[1])
    }
    if (currentLocation != newLocation) {
      socket.emit("manual-room-switch", {enter: newLocation}) // Custom emit for demo purpose
    }
  }, [location]);


  useEffect(() => {

    function onFooEvent(param:string, data:any) {
      setFooEvents((previous:any[]) => {
        const updatedEvents = [{type: param, data: data, time: formatDateTime(new Date()) }, ...previous];
        while (updatedEvents.length > 10) { 
          updatedEvents.pop()
        }
        return updatedEvents;
      });
    }

    socket.onAny(onFooEvent)


    return () => {
      socket.offAny(onFooEvent); 
    };
  }, []);

  return (
    <div className="App">
      <ConnectionState id={ socketId } />
      <Events events={ fooEvents } />
    </div>
  );
}

export default SocketIOHandler