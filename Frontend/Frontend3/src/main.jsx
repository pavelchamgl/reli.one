import i18n from "../language/i18next.js";
import { I18nextProvider } from "react-i18next";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { persistor, store } from "./redux/index.js";

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
import MobProdResenzePage from "./pages/MobProdResenzePage.jsx";
import MobCreateResenze from "./pages/MobCreateResenze.jsx";
import MobLoginPage from "./pages/MobLoginPage.jsx";
import MobProfileNavPage from "./pages/MobProfileNavPage.jsx";
import MobCategoryPage from "./pages/MobCategoryPage.jsx";
import OtpConfirmPage from "./pages/OtpConfirmPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import PassEmailConfirmPage from "./pages/PassEmailConfirmPage.jsx";
import OtpPassConfirmPage from "./pages/OtpPassConf.jsx";
import CreateNewPass from "./pages/CreateNewPass.jsx";
import RegRulesPage from "./pages/RegRulesPage.jsx";

import SellerGoodPage from "./pages/SellerGoodPage.jsx";
import SellerGoodsList from "./pages/SellerGoodsList.jsx";
import SellerHomePage from "./pages/SellerHomePage.jsx";
import SellerOrdersPage from "./pages/SellerOrdersPage.jsx";
import SellerCreatePage from "./pages/SellerCreatePage.jsx";
import SellerPreviewPage from "./pages/SellerPreviewPage.jsx";
import SellerPage from "./pages/SellerPage.jsx";
import EditGoodsPage from "./pages/EditGoodsPage.jsx";
import SellerEditPreview from "./pages/SellerEditPreview.jsx";
import { PersistGate } from "redux-persist/integration/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import DeleteMyDataPage from "./pages/DeleteMyDataPage.jsx";
import SellerIdPage from "./pages/SellerIdPage.jsx";

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
        path: "/register_rules",
        element: <RegRulesPage />,
      },
      {
        path: "/for_sell",
        element: <ForrSellerPage />,
      },
      { path: "/for_buy", element: <ForBuyersPage /> },
      { path: "/liked", element: <LikedPage /> },
      { path: "/my_orders", element: <MyOrdersPage /> },
      { path: "/product/:id", element: <ProductPage /> },
      { path: "/payment_end", element: <PaymentEnd /> },


      { path: "/change_pass", element: <ChangePassPage /> },
      { path: "/sign_up", element: <SignUpPage /> },
      { path: "/email_conf", element: <EmailConfirmPage /> },
      { path: "/email_pass_conf", element: <PassEmailConfirmPage /> },
      { path: "/otp_pass_conf", element: <OtpPassConfirmPage /> },
      { path: "/otp_conf", element: <OtpConfirmPage /> },
      { path: "/create_new_pass", element: <CreateNewPass /> },
      { path: "/privacy-policy", element: <PrivacyPolicyPage /> },
      { path: "/terms", element: <TermsPage /> },
      { path: "/delete-my-data", element: <DeleteMyDataPage /> },

      { path: "/mob_login", element: <MobLoginPage /> },
      { path: "/mob_basket", element: <BasketPage /> },
      { path: "/mob_category/:id", element: <MobCategoryPage /> },


      { path: "/mob_resenze/:id", element: <MobProdResenzePage /> },
      { path: "/mob_resenze_create/:id", element: <MobCreateResenze /> },
      { path: "/mob_profile_nav", element: <MobProfileNavPage /> },
      { path: "/product_category/:id", element: <CategoryPage /> },
    ],
  },
  { path: "/products-seller/:id", element: <SellerIdPage /> },
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
  {
    path: "*",
    element: <HomePage />,
  },
  {
    path: "/seller",
    element: <SellerPage />,
    children: [
      {
        path: "goods-choice", // Уберите начальный слэш
        element: <SellerGoodPage />,
      },
      {
        path: "goods-list",
        element: <SellerGoodsList />,
      },
      {
        path: "seller-home",
        element: <SellerHomePage />,
      },
      {
        path: "seller-orders",
        element: <SellerOrdersPage />,
      },
      {
        path: "seller-create",
        element: <SellerCreatePage />,
      },
      {
        path: "seller-preview",
        element: <SellerPreviewPage />,
      },
      {
        path: "seller-edit/:id",
        element: <EditGoodsPage />
      },
      {
        path: "edit-preview/:id",
        element: <SellerEditPreview />
      }
    ],
  },





]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId='974091491236-ugkti9gk7vado9hn0k6acutbfhv86d8f.apps.googleusercontent.com'>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <I18nextProvider i18n={i18n}>
          <React.StrictMode>
            <RouterProvider router={router}>
              <App />
            </RouterProvider>
          </React.StrictMode>
        </I18nextProvider>
      </PersistGate>
    </Provider>
  </GoogleOAuthProvider >
);
