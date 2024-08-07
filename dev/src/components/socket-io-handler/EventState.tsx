import React from 'react';
interface EventStateProps {
  events: Array<{
    type: string,
    time: string,
    data: any
  }>
}
const EventState: React.FC<EventStateProps> = ({ events } ) => {
  return (
    <ul className='socket-list'>
    {
      events.map((event: {type: string, time: string, data: any}, index:number) =>
        <li className="socket-list-item" key={ index } title={JSON.stringify(event.data, null, 2)}>
          <span>✨ { event.type }</span>
          <em>{event.time}</em>
        </li>
      )
    }
    </ul>
  );
}


export {EventState}
