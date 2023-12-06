import { useSelector } from 'react-redux'
import {getGoods, getLoadingGoodsPage, getSearchGoods} from 'pages/GoodsPage'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import {  useEffect } from 'react'
import cls from 'pages/GoodsPage/ui/GoodsPage/GoodsPage.module.scss'
import { Skeleton, SkeletonState } from 'share/ui/Skeleton'
import { GoodsList } from 'entities/Good'
import { Page } from 'share/ui/Page/Page'
import { SearchGoods } from 'pages/GoodsPage/ui/SearchGoods/ui/SearchGoods'
import { fetchSortPageGood } from 'pages/GoodsPage/models/actions/fetchSortPageGood'
import { getSearchMainGoods } from 'pages/GoodsPage/models/selectors/goodsPageSelector'

const GoodsPage: React.FC = () => {
    const arrGoods = useSelector(getGoods.selectAll)
    const isLoading = useSelector(getLoadingGoodsPage)
    const search = useSelector(getSearchMainGoods)
    const dispatch = useAppDispatch()
    useEffect(() => {
        window.scrollTo(0, 0);
        dispatch(fetchSortPageGood({replace: true}))

    }, [search])


    const SkeletonsLoader = () => {
        return (<>
            <div className={cls.SkeletonGoodsContaier}>
                <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
                <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
                <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
                <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
                <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
                <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
                <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
                <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
                <Skeleton state={SkeletonState.V2} height={'400px'} width={'400px'} border={'20px'}/>
            </div>
        </>)
    }
    return (<>

        <Page>
            <div className={cls.InputConatiner}><SearchGoods/></div>
            <GoodsList goods={arrGoods}/>
            {isLoading && <SkeletonsLoader/>}
        </Page>
    </>
    )
}
export default GoodsPage
