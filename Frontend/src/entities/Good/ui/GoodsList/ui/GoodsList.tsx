import { memo } from 'react'
import { type Good } from '../../../models/types/GoodType'
import { GoodsListItem } from '../../GoodsListItem/index'
import cls from './GoodsList.module.scss'

export interface GoodsListProps {
    goods?: Good[]
}
export const GoodsList: React.FC<GoodsListProps> = memo((props: GoodsListProps) => {
    const { goods } = props
    const renderItem = (item: Good) => {
        return (<>
            <GoodsListItem images={item?.images} id= {item?.id} key = {item?.id} model={item?.name} params={item.parameters} />
        </>)
    }

    return (<div className={cls.GoodsContainer}>
        {
            goods?.length > 0 ? goods?.map(renderItem) : null
        }
    </div>)
})
