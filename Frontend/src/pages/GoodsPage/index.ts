export { AsyncGoodsPage as GoodsPage } from './ui/GoodsPage/AsyncGoodsPage'
export { type GoodsPageSchema } from './models/types/GoodsPageSchema'
export { getErrorGoodsPage, getStateGoodPage, getLoadingGoodsPage, getSearchGoods } from './models/selectors/goodsPageSelector'
export { goodsPageReducer, getGoods, setSearch } from './models/sliceGoods/sliceGoods'
