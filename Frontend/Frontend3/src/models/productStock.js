/**
 * Stock availability fields from Task 020 API.
 * @see docs/tasks/020-product-stock-availability-api/task.md
 */

/** @typedef {'in_stock' | 'few_left' | 'out_of_stock'} StockStatus */

export const STOCK_STATUS = Object.freeze({
  IN_STOCK: "in_stock",
  FEW_LEFT: "few_left",
  OUT_OF_STOCK: "out_of_stock",
});

/**
 * List / search / category product item stock fields.
 * @typedef {Object} ProductListStockFields
 * @property {number} [total_available_quantity]
 * @property {boolean} [is_available]
 * @property {StockStatus} [stock_status]
 */

/**
 * Product detail variant stock fields.
 * @typedef {Object} ProductVariantStockFields
 * @property {number} [available_quantity]
 * @property {boolean} [is_available]
 * @property {StockStatus} [stock_status]
 */
