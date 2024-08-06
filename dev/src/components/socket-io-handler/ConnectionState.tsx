import React from 'react';

export function ConnectionState({ id }) {
  return (
    <div className="socket-header">
      <span><strong>Socket id:</strong> { id }</span>
    </div>
);
}