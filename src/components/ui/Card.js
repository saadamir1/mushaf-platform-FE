import React from 'react';

const Card = ({ children, className = '', hover = false, ...props }) => {
  const classes = ['card', hover && 'card-hover', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
