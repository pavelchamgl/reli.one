// Frontend3/src/analytics/analytics.js
// Отправляем события ТОЛЬКО через dataLayer (GTM подхватит)
// Сигнатуры функций сохранены: trackPurchase(orderId, value, currency), trackAddToCart(product)

const pushDL = (obj) => {
  if (!window || !window.dataLayer) return;
  window.dataLayer.push(obj);
};

// Нормализация товара под схему GA4 items
const toGa4Item = (product) => {
  if (!product) return null;

  const quantity = Number(product.quantity ?? 1) || 1;
  const price = Number(product.price ?? product.unit_price ?? 0) || 0;

  return {
    // ОБЯЗАТЕЛЬНЫЕ
    item_id:  String(product.sku ?? product.id ?? product.code ?? ''), // sku предпочтительно
    item_name: String(product.name ?? product.title ?? 'Item'),

    // РЕКОМЕНДУЕМЫЕ
    price,
    quantity,

    // ОПЦИОНАЛЬНЫЕ — прокидываем если есть
    item_brand: product.brand ?? undefined,
    item_category: product.category ?? product.category_name ?? undefined,
    item_variant: product.variant ?? product.variant_name ?? undefined
  };
};

// Очистка ecommerce перед каждым e-commerce событием — рекомендация GA4
const resetEcommerce = () => pushDL({ ecommerce: null });

/**
 * Событие "добавление в корзину"
 * Сигнатура сохранена: trackAddToCart(product)
 * product: ожидается объект с полями минимум { sku|id, name|title, price, quantity? }
 */
export const trackAddToCart = (product) => {
  if (typeof window === 'undefined') return;

  const item = toGa4Item(product);
  if (!item) return;

  // value = price * quantity
  const value = (Number(item.price) || 0) * (Number(item.quantity) || 1);

  resetEcommerce();
  pushDL({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'EUR',     // как и раньше у вас было в проекте
      value,
      items: [item]
    }
  });
};

/**
 * Событие "покупка"
 * Сигнатура сохранена: trackPurchase(orderId, value, currency)
 * Дополнительно можно передать 4-м аргументом массив items (совместимо с текущими вызовами)
 * itemsArray: [{ item_id, item_name, price, quantity, ... }]
 */
export const trackPurchase = (orderId, value, currency, itemsArray = []) => {
  if (typeof window === 'undefined') return;

  const txId = String(orderId ?? '');
  const totalValue = Number(value) || 0;
  const curr = currency || 'EUR';

  // Если itemsArray не передан — не падаем, просто отправляем без списка товаров
  const normalizedItems = Array.isArray(itemsArray)
    ? itemsArray.map(toGa4Item).filter(Boolean)
    : [];

  resetEcommerce();
  pushDL({
    event: 'purchase',
    ecommerce: {
      transaction_id: txId,   // ОБЯЗАТЕЛЬНО
      value: totalValue,      // ОБЯЗАТЕЛЬНО (брутто, как в Ads)
      currency: curr,         // ОБЯЗАТЕЛЬНО
      // список товаров — по возможности передавайте (улучшит отчеты и ремаркетинг)
      ...(normalizedItems.length ? { items: normalizedItems } : {})
    }
  });
};
