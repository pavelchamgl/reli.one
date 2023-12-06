import { useSelector } from 'react-redux'
import {getErrorGoodsPage, getGoods, getLoadingGoodsPage, setSearch} from 'pages/GoodsPage'
import { GoodsList } from 'entities/Good'
import { useTranslation } from 'react-i18next'
import { Skeleton, SkeletonState } from 'share/ui/Skeleton'
import { useEffect } from 'react'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { fetchSortPageGood } from 'pages/GoodsPage/models/actions/fetchSortPageGood'
import cls from './GoodsHome.module.scss'
export const GoodsHome: React.FC = () => {
    const isLoadgin = useSelector(getLoadingGoodsPage)
    const arrGoods = useSelector(getGoods.selectAll)
    const error = useSelector(getErrorGoodsPage)
    const dispatch = useAppDispatch()
    const { t } = useTranslation('main')
    useEffect(() => {
        dispatch(fetchSortPageGood({ replace: true }))

        return () => {
            dispatch(setSearch(undefined))
            dispatch(fetchSortPageGood({ replace: true }))
        }
    }, [])
    const SkeletonProvider = () => {
        return (<div className = {cls.SkeletonGoodsContaier}>
            <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
            <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
            <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
            <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
            <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
            <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
        </div>)
    }
    if (error) {
        return <h1 className={cls.alert}
        >{t('Pro zobrazení produktů musíte být registrováni!')}</h1>
    }
    return (<>
        <GoodsList goods={arrGoods}/>
        {isLoadgin && <SkeletonProvider/>}
    </>)
}
