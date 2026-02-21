import React from 'react';

const EmptyState = ({ 
  icon = '🔍', 
  title = 'No Results Found', 
  description = 'Try adjusting your search',
  action 
}) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  );
};

export default EmptyState;
