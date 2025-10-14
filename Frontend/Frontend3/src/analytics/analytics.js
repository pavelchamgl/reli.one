export const trackPurchase = (orderId, value, currency) => {
    if (typeof window.gtag === "function") {
        window.gtag("event", "purchase", {
            transaction_id: orderId,
            value: value,
            currency: currency,
        });
    }
};

export const trackAddToCart = (product) => {
    if (typeof window.gtag === "function") {
        window.gtag("event", "add_to_cart", {
            currency: "EUR",
            value: product.price,
            items: [product],
        });
    }
};
