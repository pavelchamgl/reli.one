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
