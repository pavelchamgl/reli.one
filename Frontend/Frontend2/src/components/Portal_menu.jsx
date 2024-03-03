import React from 'react';
import ReactDOM from 'react-dom';

const Portal_menu = ({ children }) => {
  const portalRoot = document.getElementById('portal-root');
  return ReactDOM.createPortal(children, portalRoot);
};

export default Portal_menu;
