import React from 'react';
import { FiSearch } from 'react-icons/fi';

const EmptyState = ({
  icon = <FiSearch className="empty-icon-svg" />,
  title = 'No Results Found',
  description = 'Try adjusting your search or filters.',
  action = null
}) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        {typeof icon === 'string' ? icon : icon}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="empty-actions">{action}</div>}
    </div>
  );
};

export default EmptyState;
