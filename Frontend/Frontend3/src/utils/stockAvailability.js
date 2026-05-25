import { STOCK_STATUS } from "../models/productStock.js";

/**
 * @param {import('../models/productStock.js').StockStatus | undefined | null} stockStatus
 * @returns {string | null} i18n key
 */
export function getStockTranslationKey(stockStatus) {
  switch (stockStatus) {
    case STOCK_STATUS.IN_STOCK:
      return "in_stock";
    case STOCK_STATUS.FEW_LEFT:
      return "few_left";
    case STOCK_STATUS.OUT_OF_STOCK:
      return "out_of_stock";
    default:
      return null;
  }
}

/**
 * @param {{ is_available?: boolean, stock_status?: string } | null | undefined} item
 * @returns {boolean}
 */
export function isItemAvailable(item) {
  if (!item) {
    return false;
  }
  if (typeof item.is_available === "boolean") {
    return item.is_available;
  }
  if (item.stock_status) {
    return item.stock_status !== STOCK_STATUS.OUT_OF_STOCK;
  }
  return true;
}

/**
 * @param {{ is_available?: boolean, stock_status?: string } | null | undefined} product
 * @returns {import('../models/productStock.js').StockStatus | null}
 */
export function getProductStockStatus(product) {
  if (!product?.stock_status) {
    return null;
  }
  return product.stock_status;
}

/**
 * @param {{ is_available?: boolean, stock_status?: string } | null | undefined} variant
 * @returns {import('../models/productStock.js').StockStatus | null}
 */
export function getVariantStockStatus(variant) {
  if (!variant?.stock_status) {
    return null;
  }
  return variant.stock_status;
}

/**
 * Prefer list item stock fields; fall back to detail payload when list omits them.
 * @param {{ is_available?: boolean, stock_status?: string } | null | undefined} listItem
 * @param {{ is_available?: boolean, stock_status?: string } | null | undefined} detailItem
 * @returns {{ is_available?: boolean, stock_status?: string } | null | undefined}
 */
export function getListItemStockSource(listItem, detailItem) {
  if (
    listItem?.stock_status != null ||
    typeof listItem?.is_available === "boolean"
  ) {
    return listItem;
  }
  if (
    detailItem?.stock_status != null ||
    typeof detailItem?.is_available === "boolean"
  ) {
    return detailItem;
  }
  return listItem ?? detailItem;
}

/**
 * Guard add-to-basket payloads. Legacy items without stock fields remain allowed.
 * @param {{ sku?: string, is_available?: boolean, stock_status?: string, product?: { is_available?: boolean, stock_status?: string, variants?: Array<{ sku?: string, is_available?: boolean, stock_status?: string }> } } | null | undefined} payload
 * @returns {boolean}
 */
export function canAddToBasket(payload) {
  if (!payload) {
    return false;
  }

  const variant =
    payload.sku
      ? payload.product?.variants?.find((item) => item.sku === payload.sku)
      : undefined;

  if (
    variant &&
    (variant.stock_status != null || typeof variant.is_available === "boolean")
  ) {
    return isItemAvailable(variant);
  }

  if (typeof payload.is_available === "boolean") {
    return payload.is_available;
  }
  if (payload.stock_status) {
    return payload.stock_status !== STOCK_STATUS.OUT_OF_STOCK;
  }

  if (
    payload.product &&
    (payload.product.stock_status != null ||
      typeof payload.product.is_available === "boolean")
  ) {
    return isItemAvailable(payload.product);
  }

  return true;
}
