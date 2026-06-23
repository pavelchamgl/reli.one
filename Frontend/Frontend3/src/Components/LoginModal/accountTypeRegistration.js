export const getSellerRegistrationUrl = () =>
  new URL("/seller/create-account", window.location.origin).toString();
