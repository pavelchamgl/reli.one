import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { I18nextProvider } from "react-i18next"
import i18n from './language/i18next.js';
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import ForSeller from './pages/ForSeller/ForSeller.jsx';


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />
  },
  {
    path: "/for-sell",
    element: <ForSeller />
  }
])


ReactDOM.createRoot(document.getElementById('root')).render(
  <I18nextProvider i18n={i18n}>
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  </I18nextProvider>,
);
