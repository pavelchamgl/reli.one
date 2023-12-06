import { memo, useCallback } from 'react'
import { Cart, CartListState } from 'share/ui/Cart'
import imgItem from '../models/imgs/ImageSale.png'
import { useTranslation } from 'react-i18next'
import cls from './GoodsListItem.module.scss'
import { useNavigate } from 'react-router-dom'
import { PathRouts } from 'app/providers/Routing/lib/Store'

interface GoodsListItemProps {
    id: string
    model: string,
    imgs: Array<{image: string}>,
    params : Record<string,string>

}
export const GoodsListItem: React.FC<GoodsListItemProps> = memo((props: GoodsListItemProps) => {
    const {
        params,
        model,
        imgs,
        id
    } = props
    const navigate = useNavigate()
    const NavigateClick = useCallback(() => {
        navigate(`${PathRouts.goods_detail}${id}`)
    }, [])
    const { t } = useTranslation('goods')


    return (<>
        <div onClick={NavigateClick}>
            <Cart classe={cls.ListItemContainer} state={CartListState.SALECART}>
                {imgs?.map((img, index) => index === 0 ? <img src={img.image}/> : undefined )}
                
                <h2>{t('MODEL')}: {t(model)}</h2>
                {
                   params && Object.entries(params).map(([key,value], index) =>
                    index < 3 ? <div> <p>{t(key)}</p>  <p>{t(value)}</p> </div> : undefined
                    )
                }
            </Cart>
        </div>
    </>)
})
