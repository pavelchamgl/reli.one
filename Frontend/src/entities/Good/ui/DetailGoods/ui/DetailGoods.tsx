import { memo, useEffect } from 'react'
import { DynamicProvider } from 'share/libs/DynamicRedux/DynamicProvider'
import { getErrorGood, getGood, getLoadingGood } from '../../../models/selectors/goodSelector'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Skeleton } from 'share/ui/Skeleton'
import { commentReducer } from 'entities/Comments'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { fetchGoodById } from '../../../models/actions/fetchGoodById'
import { SkeletonState } from 'share/ui/Skeleton/ui/Skeleton'
import { goodReducer } from '../../../models/goodSlice/goodSlice'
import { GoodItem } from '../../GoodItem/GoodItem'
import { useTranslation } from 'react-i18next'

const DetailGoods: React.FC = () => {
    const data = useSelector(getGood)
    const id = useParams<{ id: string }>()
    const dispatch = useAppDispatch()
    const isLoading = useSelector(getLoadingGood)
    const error = useSelector(getErrorGood)
    const { t } = useTranslation()
    useEffect(() => {
        dispatch(fetchGoodById(id.id))
    }, [])
    const SkeletonProvide = () => {
        return (<>
            <div >
                <Skeleton state={SkeletonState.V1} height={'80vh'} width={'1400px'} border={'20px'}/>
            </div>
        </>)
    }
    const ErrorProvide = () => {
        return (<>
            <div >
                <h1>{t('Něco se pokazilo')}</h1>
            </div>
        </>)
    }
    if (error) {
        return (<ErrorProvide/>)
    }
    return (<>
        <DynamicProvider DynamicReducers={{ goods: goodReducer, comments: commentReducer }}>
            {
                data && !isLoading ? <GoodItem imgs={data.image} price= {data.price} model={data.name} parametrs={data.parameters} id={id.id}/> : <SkeletonProvide/>
            }
        </DynamicProvider>
    </>)
}
export default memo(DetailGoods)
