import { InputCustom, InputState } from 'share/ui/InputCustom/ui/InputCustom'
import { useCallback } from 'react'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { getSearchGoods, setSearch } from 'pages/GoodsPage'
import { useSelector } from 'react-redux'
import cls from './SearchGoods.module.scss'
import { getSearchMainGoods } from 'pages/GoodsPage/models/selectors/goodsPageSelector'
import { setSearchMain } from 'pages/GoodsPage/models/sliceGoods/sliceGoods'
export const SearchGoods: React.FC = () => {
    const dispatch = useAppDispatch()
    const search = useSelector(getSearchMainGoods)
    const SearchChange = useCallback((e: string) => {
        dispatch(setSearchMain(e))
    }, [dispatch])
    return (<>
        <InputCustom classe={cls.InputSearch} value={search} onChange={SearchChange} placeholder={'Search...'} state={InputState.COMMENTINPUT}/>
    </>)
}
