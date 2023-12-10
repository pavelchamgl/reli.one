import { InputCustom, InputState } from 'share/ui/InputCustom/ui/InputCustom'
import { useCallback } from 'react'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { getSearchGoods, setSearch } from 'pages/GoodsPage'
import { useSelector } from 'react-redux'
import cls from './SearchGoods.module.scss'
import { getSearchMainGoods } from 'pages/GoodsPage/models/selectors/goodsPageSelector'
import { setSearchMain } from 'pages/GoodsPage/models/sliceGoods/sliceGoods'
import { fetchSortPageGood } from 'pages/GoodsPage/models/actions/fetchSortPageGood'
export const SearchGoods: React.FC = () => {
    const dispatch = useAppDispatch()
    const search = useSelector(getSearchGoods)
    const SearchChange = useCallback((e: string) => {
        dispatch(setSearch(e))
        dispatch(fetchSortPageGood({replace: false}))
    }, [dispatch])
    return (<>
        <InputCustom classe={cls.InputSearch} value={search} onChange={SearchChange} placeholder={'Search...'} state={InputState.COMMENTINPUT}/>
    </>)
}
