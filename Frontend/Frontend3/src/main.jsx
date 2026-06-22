import "./styles/tailwind-shadcn.css";
import { installDomTranslateGuard } from "./utils/domTranslateGuard.js";
import * as Sentry from "@sentry/react";

installDomTranslateGuard();
import i18n from "../language/i18next.js";
import { I18nextProvider } from "react-i18next";
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Strip auth tokens from extra data — never send PII to Sentry
      if (event.extra) {
        delete event.extra.token;
        delete event.extra.access_token;
        delete event.extra.refresh_token;
      }
      return event;
    },
  });
}
import App from "./App.jsx";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { persistor, store } from "./redux/index.js";
import { PersistGate } from "redux-persist/integration/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ProtectedRoute from "./Components/ProtectedRoute/ProtectedRoute.jsx";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary.jsx";

const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const MainPage = lazy(() => import("./pages/MainPage.jsx"));
const SearchPage = lazy(() => import("./pages/SearchPage.jsx"));
const ForrSellerPage = lazy(() => import("./pages/ForrSellerPage.jsx"));
const ForBuyersPage = lazy(() => import("./pages/ForBuyersPage.jsx"));
const LikedPage = lazy(() => import("./pages/LikedPage.jsx"));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage.jsx"));
const ProductPage = lazy(() => import("./pages/ProductPage.jsx"));
const BasketPage = lazy(() => import("./pages/BasketPage.jsx"));
const PaymentPage = lazy(() => import("./pages/PaymentPage.jsx"));
const PaymentEnd = lazy(() => import("./pages/PaymentEnd.jsx"));
const ChangePassPage = lazy(() => import("./pages/ChangePassPage.jsx"));
const SignUpPage = lazy(() => import("./pages/SignUpPage.jsx"));
const EmailConfirmPage = lazy(() => import("./pages/EmailConfirmPage.jsx"));
const MobProdResenzePage = lazy(() => import("./pages/MobProdResenzePage.jsx"));
const MobCreateResenze = lazy(() => import("./pages/MobCreateResenze.jsx"));
const MobLoginPage = lazy(() => import("./pages/MobLoginPage.jsx"));
const MobProfileNavPage = lazy(() => import("./pages/MobProfileNavPage.jsx"));
const MobCategoryPage = lazy(() => import("./pages/MobCategoryPage.jsx"));
const OtpConfirmPage = lazy(() => import("./pages/OtpConfirmPage.jsx"));
const CategoryPage = lazy(() => import("./pages/CategoryPage.jsx"));
const PassEmailConfirmPage = lazy(() => import("./pages/PassEmailConfirmPage.jsx"));
const OtpPassConfirmPage = lazy(() => import("./pages/OtpPassConf.jsx"));
const CreateNewPass = lazy(() => import("./pages/CreateNewPass.jsx"));
const RegRulesPage = lazy(() => import("./pages/RegRulesPage.jsx"));
const SellerGoodPage = lazy(() => import("./pages/SellerGoodPage.jsx"));
const SellerGoodsList = lazy(() => import("./pages/SellerGoodsList.jsx"));
const SellerHomePage = lazy(() => import("./pages/SellerHomePage.jsx"));
const SellerOrdersPage = lazy(() => import("./pages/SellerOrdersPage.jsx"));
const SellerCreatePage = lazy(() => import("./pages/SellerCreatePage.jsx"));
const SellerPreviewPage = lazy(() => import("./pages/SellerPreviewPage.jsx"));
const SellerPage = lazy(() => import("./pages/SellerPage.jsx"));
const EditGoodsPage = lazy(() => import("./pages/EditGoodsPage.jsx"));
const SellerEditPreview = lazy(() => import("./pages/SellerEditPreview.jsx"));
const TermsPage = lazy(() => import("./pages/TermsPage.jsx"));
const DeleteMyDataPage = lazy(() => import("./pages/DeleteMyDataPage.jsx"));
const SellerIdPage = lazy(() => import("./pages/SellerIdPage.jsx"));
const GeneralDataProtection = lazy(() => import("./pages/GeneralDataProtection.jsx"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage.jsx"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy.jsx"));
const NewSellerOrder = lazy(() => import("./sellerPages/NewSellerOrder/NewSellerOrder.jsx"));
const NewSellerOrderDetal = lazy(() => import("./sellerPages/NewSellerOrderDetal/NewSellerOrderDetal.jsx"));
const SellerLogin = lazy(() => import("./sellerPages/SellerLogin/SellerLogin.jsx"));
const SellerReset = lazy(() => import("./sellerPages/SellerReset/SellerReset.jsx"));
const SellerSuccessfullyReset = lazy(() => import("./sellerPages/SellerSuccessfullyReset/SellerSuccessfullyReset.jsx"));
const SellerVerifyEmail = lazy(() => import("./sellerPages/SellerVerifyEmail/SellerVerifyEmail.jsx"));
const SellerCreateNewPass = lazy(() => import("./sellerPages/SellerCreateNewPass/SellerCreateNewPass.jsx"));
const SellerType = lazy(() => import("./sellerPages/SellerTypePage/SellerType.jsx"));
const SellerCreateAccount = lazy(() => import("./sellerPages/SellerCreateAccount/SellerCreateAccount.jsx"));
const CreateVerifyEmail = lazy(() => import("./sellerPages/CreateVerifyEmail/CreateVerifyEmail.jsx"));
const ApplicationSubmited = lazy(() => import("./sellerPages/ApplicationSubmited/ApplicationSubmited.jsx"));
const SellerInformation = lazy(() => import("./sellerPages/SellerInformation/SellerInformation.jsx"));
const ReviewInfoPage = lazy(() => import("./sellerPages/ReviewInfoPage/ReviewInfoPage.jsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.jsx"));
const SellerCompanyInfo = lazy(() => import("./sellerPages/SellerCompanyInfo/SellerCompanyInfo.jsx"));
const SellerReviewCompany = lazy(() => import("./sellerPages/SellerReviewCompany/SellerReviewCompany.jsx"));
const NewSellerPage = lazy(() => import("./pages/NewSellerPage.jsx"));
const ClaimsAndRightsPage = lazy(() => import("./pages/ClaimsAndRightsPage.jsx"));
const Withdrawal = lazy(() => import("./pages/Withdrawal.jsx"));
const ContactReturnPage = lazy(() => import("./pages/ContactReturnPage.jsx"));
const NewTermsPage = lazy(() => import("./pages/NewTermsPage.jsx"));
const FinishVerificationPage = lazy(() => import("./sellerPages/FinishVerificationPage/FinishVerificationPage.jsx"));
const ActionRequiredPage = lazy(() => import("./sellerPages/ActionRequiredPage/ActionRequiredPage.jsx"));
const UnderReviewPage = lazy(() => import("./sellerPages/UnderReviewPage/UnderReviewPage.jsx"));
const VerifiedAnalyt = lazy(() => import("./sellerPages/VerifiedAnalyt/VerifiedAnalyt.jsx"));

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
      {
        path: "/for-sell-new",
        element: <NewSellerPage />,
      },
      { path: "/for_buy", element: <ForBuyersPage /> },
      { path: "/liked", element: <LikedPage /> },
      { path: "/my_orders", element: <MyOrdersPage /> },
      { path: "/product/:id", element: <ProductPage /> },
      { path: "/payment_end", element: <PaymentEnd /> },
      {
        path: "/contact", element: <ContactPage />
      },


      { path: "/change_pass", element: <ChangePassPage /> },
      { path: "/sign_up", element: <SignUpPage /> },
      { path: "/email_conf", element: <EmailConfirmPage /> },
      { path: "/email_pass_conf", element: <PassEmailConfirmPage /> },
      { path: "/otp_pass_conf", element: <OtpPassConfirmPage /> },
      { path: "/otp_conf", element: <OtpConfirmPage /> },
      { path: "/create_new_pass", element: <CreateNewPass /> },
      { path: "/terms", element: <TermsPage /> },
      {
        path: "/new-term", element: <NewTermsPage />
      },
      { path: "/delete-my-data", element: <DeleteMyDataPage /> },

      { path: "/mob_login", element: <MobLoginPage /> },
      { path: "/mob_basket", element: <BasketPage /> },
      { path: "/mob_category/:id", element: <MobCategoryPage /> },


      { path: "/mob_resenze/:id", element: <MobProdResenzePage /> },
      { path: "/mob_resenze_create/:id", element: <MobCreateResenze /> },
      { path: "/mob_profile_nav", element: <MobProfileNavPage /> },
      { path: "/product_category/:id", element: <CategoryPage /> },
      {
        path: "/general-protection", element: <GeneralDataProtection />
      },
      {
        path: "/privacy-policy", element: <PrivacyPolicyPage />
      },
      {
        path: "/cookie-policy", element: <CookiePolicy />
      },
      {
        path: '/claim', element: <ClaimsAndRightsPage />
      },
      {
        path: "/withdrawal", element: <Withdrawal />
      },
      {
        path: "/contact-return", element: <ContactReturnPage />
      }
    ],
  },
  { path: "/products-seller/:id", element: <SellerIdPage /> },
  {
    path: "/basket",
    element: <BasketPage />,
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
        path: "goods-choice",
        element: <ProtectedRoute><SellerGoodPage /></ProtectedRoute>,
      },
      {
        path: "goods-list",
        element: <ProtectedRoute><SellerGoodsList /></ProtectedRoute>,
      },
      {
        path: "seller-home",
        element: <ProtectedRoute><SellerHomePage /></ProtectedRoute>,
      },
      {
        path: "seller-orders",
        element: <ProtectedRoute><SellerOrdersPage /></ProtectedRoute>,
      },
      {
        path: "seller-order",
        element: <ProtectedRoute><NewSellerOrder /></ProtectedRoute>,
      },
      {
        path: "seller-order-detal/:id",
        element: <ProtectedRoute><NewSellerOrderDetal /></ProtectedRoute>,
      },
      {
        path: "seller-create",
        element: <ProtectedRoute><SellerCreatePage /></ProtectedRoute>,
      },
      {
        path: "seller-preview",
        element: <ProtectedRoute><SellerPreviewPage /></ProtectedRoute>,
      },
      {
        path: "seller-preview/:id",
        element: <ProtectedRoute><SellerPreviewPage /></ProtectedRoute>,
      },
      {
        path: "seller-edit/:id",
        element: <ProtectedRoute><EditGoodsPage /></ProtectedRoute>,
      },
      {
        path: "edit-preview/:id",
        element: <ProtectedRoute><SellerEditPreview /></ProtectedRoute>,
      },
      {
        path: "login",
        element: <SellerLogin />
      },
      {
        path: "reset",
        element: <SellerReset />
      },
      {
        path: "successfully-reset",
        element: <SellerSuccessfullyReset />
      },
      {
        path: "verify-email",
        element: <SellerVerifyEmail />
      },
      {
        path: "create-password",
        element: <SellerCreateNewPass />
      },
      {
        path: "seller-type",
        element: <SellerType />
      },
      {
        path: "create-account",
        element: <SellerCreateAccount />
      },
      {
        path: "create-verify",
        element: <CreateVerifyEmail />
      },
      {
        path: "application-sub",
        element: <ApplicationSubmited />
      },
      {
        path: "seller-info",
        element: <SellerInformation />
      },
      {
        path: "seller-review",
        element: <ReviewInfoPage />
      },
      {
        path: "seller-company",
        element: <SellerCompanyInfo />
      },
      {
        path: "seller-review-company",
        element: <SellerReviewCompany />
      },
      {
        path: 'finish-verification',
        element: <FinishVerificationPage />
      },
      {
        path: 'action-required',
        element: <ActionRequiredPage />
      },
      {
        path: 'under-review',
        element: <UnderReviewPage />
      },
      {
        path: 'verified-analyt',
        element: <VerifiedAnalyt />
      }
    ],
  },





]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <I18nextProvider i18n={i18n}>
          <React.StrictMode>
            <ErrorBoundary area="app">
              <Suspense fallback={null}>
                <RouterProvider router={router}>
                  <App />
                </RouterProvider>
              </Suspense>
            </ErrorBoundary>
          </React.StrictMode>
        </I18nextProvider>
      </PersistGate>
    </Provider>
  </GoogleOAuthProvider >
);
