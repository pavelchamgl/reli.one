import { useEffect, useState } from 'react'
import SearchInp from '../../../../ui/Seller/newOrder/searchInp/SearchInp'
import FilterSelect from '../../../../ui/Seller/newOrder/filterSelect/FilterSelect'
import DateInp from '../../../../ui/Seller/newOrder/dateInp/DateInp'

import searchWhite from "../../../../assets/Seller/newOrder/searchWhite.svg"

import styles from './FilterBlock.module.scss';
import { useActionNewOrder } from '../../../../hook/useActionNewOrder'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

const FilterBlock = () => {

    const [status, setStatus] = useState("")
    const [statusOpen, setStatusOpen] = useState()

    const [carrier, setCarrier] = useState("")
    const [carrierOpen, setCarrierOpen] = useState()

    const [delivery, setDelivery] = useState("")
    const [deliveryOpen, setDeliveryOpen] = useState()


    const { clearFilter } = useSelector(state => state.newOrder)
    const { setClearFilter, getOrdersByFilters } = useActionNewOrder()

    const { t } = useTranslation('sellerOrder')


    const statuses = [
        {
            text: t("cancelled"),
            value: "Cancelled"
        },
        {
            text: t("completed"),
            value: "Completed"
        },
        {
            text: t("pending"),
            value: "Pending"
        },
        {
            text: t("processing"),
            value: "Processing"
        },
        {
            text: t("shipped"),
            value: "Shipped"
        },
    ]

    const carriers = [
        {
            text: "DPD",
            value: 1
        },
        {
            text: "GLS",
            value: 2
        },

    ]

    const deliveries = [
        {
            text: t("pickupPoint"),
            value: 1
        },
        {
            text: t("homeDelivery"),
            value: 2
        },
    ]

    useEffect(() => {
        if (clearFilter) {
            setCarrier("")
            setDelivery("")
            setStatus("")
            setClearFilter()
        }
    }, [clearFilter])

    return (
        <div className={styles.filterBlock}>
            <div className={styles.filterWrap}>
                <SearchInp />
                <FilterSelect title={t("status")} btnText={t("allStatuses")} itemsArr={statuses} openSelect={statusOpen} setOpenSelect={setStatusOpen} value={status} setValue={setStatus} />
                <FilterSelect title={t("carrier")} btnText={t("allCouriers")} itemsArr={carriers} openSelect={carrierOpen} setOpenSelect={setCarrierOpen} value={carrier} setValue={setCarrier} />
                <FilterSelect title={t('deliveryMethod')} btnText={t("allMethods")} itemsArr={deliveries} openSelect={deliveryOpen} setOpenSelect={setDeliveryOpen} value={delivery} setValue={setDelivery} />
                <DateInp title={t('dateFrom')} />
                <DateInp title={t("dateTo")} />
            </div>
            <div className={styles.btnsWrap}>
                <button onClick={() => {
                    getOrdersByFilters()
                }}>
                    <img src={searchWhite} alt="" />
                    <p>{t('search')}</p>
                </button>
                <button onClick={() => {
                    setClearFilter()
                    getOrdersByFilters()
                }}>
                    {t('clearFilters')}
                </button>
            </div>
        </div>
    )
}

export default FilterBlock