import cls from '../models/Category.module.scss'
import {memo, useCallback, useEffect} from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { setSearch } from 'pages/GoodsPage'
import { ButtonCustom } from 'share/ui/ButtonCustom'
import { ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'
import { fetchSortPageGood } from 'pages/GoodsPage/models/actions/fetchSortPageGood'
import { setSearchMain } from 'pages/GoodsPage/models/sliceGoods/sliceGoods'
import { useSelector } from 'react-redux'
import { getCategorys } from 'entities/Category'
import { Category } from 'entities/Category/models/type'
import { fetchCategory } from 'entities/Category/models/actions/fetchCategorys'

export const Categorys: React.FC = memo(() => {
    const { t } = useTranslation('profile')
    const categorys = useSelector(getCategorys)
    const dispatch = useAppDispatch()
    const clickHandler = useCallback((e: Category) => {
        dispatch(setSearchMain(e.name))
        dispatch(fetchSortPageGood({ replace: true }))
    }, [dispatch])
 
    return (<>
        <div className={cls.ContainerCategory} >
            <div className={cls.InnerCategory}>
                {
                    categorys?.map((category) => <ButtonCustom onClick={(() => clickHandler(category))} classes={cls.LintC} state={ButtonCustomState.RESET}>{`${category.name}`}</ButtonCustom>)
                }
            </div>
            <hr/>
        </div>
    </>)

})
