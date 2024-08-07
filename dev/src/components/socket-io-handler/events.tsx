import React from 'react';

export function Events({ events }) {
  return (
    <ul className='socket-list'>
    {
      events.map((event, index) =>
        <li className="socket-list-item" key={ index } title={JSON.stringify(event.data, null, 2)}>
          <span>✨ { event.type }</span>
          <em>{event.time}</em>
        </li>
      )
    }
    </ul>
  );
}