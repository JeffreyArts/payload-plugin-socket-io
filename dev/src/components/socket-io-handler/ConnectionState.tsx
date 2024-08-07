import React from 'react';
interface ConnectionStateProps {
  id: string | undefined;
}
const ConnectionState: React.FC<ConnectionStateProps> = ({ id }) => {
  return (
    <div className="socket-header">
      <span><strong>Socket id:</strong> { '' + id }</span>
    </div>
);
}
export {ConnectionState}