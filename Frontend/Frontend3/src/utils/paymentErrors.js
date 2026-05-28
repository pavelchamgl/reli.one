export const STOCK_CHECKOUT_ERROR_KEY = "stock_error_checkout";
export const PAYMENT_ERROR_GENERIC_KEY = "payment_error_generic";

/**
 * Maps checkout payment API errors to i18n keys.
 * @param {unknown} error axios-like error from create-stripe/paypal-payment
 * @returns {string} i18n key
 */
export function getCheckoutPaymentErrorKey(error) {
  const status = error?.response?.status;
  const stock = error?.response?.data?.stock;

  if (status === 409 && stock) {
    return STOCK_CHECKOUT_ERROR_KEY;
  }

  return PAYMENT_ERROR_GENERIC_KEY;
}
