import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import MainPage from "./pages/MainPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import ForrSellerPage from "./pages/ForrSellerPage.jsx";
import ForBuyersPage from "./pages/ForBuyersPage.jsx";
import LikedPage from "./pages/LikedPage.jsx";
import MyOrdersPage from "./pages/MyOrdersPage.jsx";
import Test from "./pages/Test.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import BasketPage from "./pages/BasketPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import PaymentEnd from "./pages/PaymentEnd.jsx";
import ChangePassPage from "./pages/ChangePassPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import EmailConfirmPage from "./pages/EmailConfirmPage.jsx";
import LinkConfPage from "./pages/LinkConfPage.jsx";
import MobProdResenzePage from "./pages/MobProdResenzePage.jsx";
import MobCreateResenze from "./pages/MobCreateResenze.jsx";
import MobLoginPage from "./pages/MobLoginPage.jsx";
import MobProfileNavPage from "./pages/MobProfileNavPage.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    children: [
      {
        path: "/",
        element: <MainPage />,
      },
      {
        path: "/search",
        element: <SearchPage />,
      },
      {
        path: "/for_sell",
        element: <ForrSellerPage />,
      },
      { path: "/for_buy", element: <ForBuyersPage /> },
      { path: "/liked", element: <LikedPage /> },
      { path: "/my_orders", element: <MyOrdersPage /> },
      { path: "/product", element: <ProductPage /> },
      { path: "/payment_end", element: <PaymentEnd /> },
      { path: "/change_pass", element: <ChangePassPage /> },
      { path: "/sign_up", element: <SignUpPage /> },
      { path: "/email_conf", element: <EmailConfirmPage /> },
      { path: "/link_conf", element: <LinkConfPage /> },
      { path: "/test", element: <Test /> },

      { path: "/mob_resenze", element: <MobProdResenzePage /> },
      { path: "/mob_resenze_create", element: <MobCreateResenze /> },
      { path: "/mob_login", element: <MobLoginPage /> },
      { path: "/mob_profile_nav", element: <MobProfileNavPage /> },
    ],
  },
  {
    path: "/basket",
    element: <BasketPage />,
  },
  {
    path: "/test",
    element: <Test />,
  },
  {
    path: "/payment",
    element: <PaymentPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </RouterProvider>
);
