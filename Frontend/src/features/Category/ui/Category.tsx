import cls from '../models/Category.module.scss'
import {memo, useCallback, useEffect} from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { setSearch } from 'pages/GoodsPage'
import { ButtonCustom } from 'share/ui/ButtonCustom'
import { ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'
import { fetchSortPageGood } from 'pages/GoodsPage/models/actions/fetchSortPageGood'
import { setSearchMain } from 'pages/GoodsPage/models/sliceGoods/sliceGoods'

export const Category: React.FC = memo(() => {
    const { t } = useTranslation('profile')
    const dispatch = useAppDispatch()
    const clickPanel = useCallback(() => {
        dispatch(setSearchMain('panel'))
        dispatch(fetchSortPageGood({ replace: true }))
    }, [dispatch])

    const clickKonektor = useCallback(() => {
        dispatch(setSearchMain('konektor'))
        dispatch(fetchSortPageGood({ replace: true }))
    }, [dispatch])

    const clickKabel = useCallback(() => {
        dispatch(setSearchMain('kabel'))
        dispatch(fetchSortPageGood({ replace: true }))
    }, [dispatch])

    const clickBatarie = useCallback(() => {
        dispatch(setSearchMain('batarie'))
        dispatch(fetchSortPageGood({ replace: true }))
    }, [dispatch])

    const clickMaterial = useCallback(() => {
        dispatch(setSearchMain('material'))
        dispatch(fetchSortPageGood({ replace: true }))
    }, [dispatch])

    const clickConverter = useCallback(() => {
        dispatch(setSearchMain('converter'))
        dispatch(fetchSortPageGood({ replace: true }))
    }, [dispatch])
    return (<>
        <div className={cls.ContainerCategory} >
            <div className={cls.InnerCategory}>
                <ButtonCustom onClick={clickPanel} classes={cls.LintC} state={ButtonCustomState.RESET}>{t('solární panel')}</ButtonCustom>
                <ButtonCustom onClick={clickKabel} classes={cls.LintC} state={ButtonCustomState.RESET}>{t('Kabela')}</ButtonCustom>
                <ButtonCustom onClick={clickKonektor} classes={cls.LintC} state={ButtonCustomState.RESET}>{t('Konektor')}</ButtonCustom>
                <ButtonCustom onClick={clickConverter} classes={cls.LintC} state={ButtonCustomState.RESET}>{t('Měnič')}</ButtonCustom>
                <ButtonCustom onClick={clickBatarie} classes={cls.LintC} state={ButtonCustomState.RESET}>{t('Baterie')}</ButtonCustom>
                <ButtonCustom onClick={clickMaterial} classes={cls.LintC} state={ButtonCustomState.RESET}>{t('Montážní materiály')}</ButtonCustom>
            </div>
            <hr/>
        </div>
    </>)

})
