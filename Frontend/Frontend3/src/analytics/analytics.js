export const trackPurchase = (orderId, value, items) => {
    if (typeof window.gtag === "function") {
        window.gtag("event", "purchase", {
            transaction_id: orderId,
            value: value,
            currency: "EUR",
            items: items,
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
