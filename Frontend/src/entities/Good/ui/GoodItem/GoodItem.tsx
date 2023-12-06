import {memo, useCallback, useEffect, useState} from 'react'
import { useTranslation } from 'react-i18next'
import panel1 from './imgs/panel1.png'
import panel2 from './imgs/panel2.png'
import panel3 from './imgs/panel3.png'
import cls from './GoodItem.module.scss'
import { useClassName } from 'share/libs/useClassName/useClassName'
import { ButtonCustom } from 'share/ui/ButtonCustom'
import { ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'
import { CommentBlock } from 'entities/Comments'
import { DynamicProvider } from 'share/libs/DynamicRedux/DynamicProvider'
import { addCommentReducer } from 'features/AddComment'


interface GoodItemProps {
    id: string
    parametrs: Record<string, string>
    imgs: Array<{image: string}>,
    model: string
    price: string

}
interface StateComponent {
    Charakteristika: boolean
    Comments: boolean
}
export const GoodItem: React.FC<GoodItemProps> = memo((props: GoodItemProps) => {
    const {
        id,
        parametrs,
        model,
        imgs,
        price
    } = props
    const [state, setState] = useState<StateComponent>({ Charakteristika: true, Comments: false })
    const { t } = useTranslation('goods')
    const HandlerClickCharakteristika = useCallback(() => {
        setState({
            Comments: false,
            Charakteristika: true
        })
    }, [state])
    const HandlerClickComments = useCallback(() => {
        setState({
            Comments: true,
            Charakteristika: false
        })
    }, [state])
    useEffect(() => {
        window.scroll(0,0)
    }, []);
    console.log(imgs)
    return (<>
        <div className = {cls.ContainerItem}>
            <div className={cls.PurchaseContainer}>
                <div className={cls.ImgContainer}>
                    {
                        imgs?.map((img,index) =>
                        index === 0 ? 
                        <img id={cls.img1} className={useClassName({ cls: cls.ImgItem, mode: {}, classes: [cls.item, cls.item1] })} src={img.image}/> :  <img id={cls.img2} className={useClassName({ cls: cls.ImgItem, mode: {}, classes: [] })} src={img.image}/> )
                    }
                </div>
                <div className={cls.Panel}>
                    <h2 style={{ fontSize: '30px' }}>{t('SUNERGY')}435w-450w</h2>
                    <h2>{t('solární panel')}</h2>
                    <h2> {price} {t('Kč')}</h2>
                    <ButtonCustom classes={cls.buttonPurchase} state={ButtonCustomState.BUTTONPURCHASE}>{t('Přidat do košíku')}</ButtonCustom>
                </div>
            </div>
            <div className={cls.ButtonContainer}>
                <ButtonCustom onClick={HandlerClickCharakteristika} classes={cls.buttonControl} state={ButtonCustomState.BUTTONINFO}>{t('Charakteristika')}</ButtonCustom>
                <ButtonCustom onClick={HandlerClickComments} classes={cls.buttonControl} state={ButtonCustomState.BUTTONINFO}>{t('Recenze')}</ButtonCustom>
                <ButtonCustom classes={cls.buttonControl} state={ButtonCustomState.BUTTONINFO}>{t('Certifikáty')}</ButtonCustom>
            </div>

            {
                state.Charakteristika
                    ? <>
                        <h1 className={cls.Order}>{t('MODEL')}: {model}</h1>
                        <div className={cls.CharacteristicContainer}>
                            <h1>{t('Statická přenosová charakteristika')}</h1>
                            <div className={cls.InnerInfoContainer}>
                               {
                                 Object.entries(parametrs).map(([key,value]) => <div><p>{key}:</p>  <p>{value}</p></div> )
                               }
                            </div>
                        </div>
            
                    </>
                    : <DynamicProvider DynamicReducers={{ addComment: addCommentReducer }}>
                        <CommentBlock id={id}/>
                    </DynamicProvider>
            }
        </div>
    </>)

})
