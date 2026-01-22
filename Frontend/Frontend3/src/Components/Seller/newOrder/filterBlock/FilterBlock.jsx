import { useEffect, useState } from 'react'
import SearchInp from '../../../../ui/Seller/newOrder/searchInp/SearchInp'
import FilterSelect from '../../../../ui/Seller/newOrder/filterSelect/FilterSelect'
import DateInp from '../../../../ui/Seller/newOrder/dateInp/DateInp'

import searchWhite from "../../../../assets/Seller/newOrder/searchWhite.svg"

import styles from './FilterBlock.module.scss';
import { useActionNewOrder } from '../../../../hook/useActionNewOrder'
import { useSelector } from 'react-redux'

const FilterBlock = () => {

    const [status, setStatus] = useState("")
    const [statusOpen, setStatusOpen] = useState()

    const [carrier, setCarrier] = useState("")
    const [carrierOpen, setCarrierOpen] = useState()

    const [delivery, setDelivery] = useState("")
    const [deliveryOpen, setDeliveryOpen] = useState()


    const { clearFilter } = useSelector(state => state.newOrder)
    const { setClearFilter, getOrdersByFilters } = useActionNewOrder()

    const statuses = [
        {
            text: "Cancelled",
            value: "Cancelled"
        },
        {
            text: "Completed",
            value: "Completed"
        },
        {
            text: "Pending",
            value: "Pending"
        },
        {
            text: "Processing",
            value: "Processing"
        },
        {
            text: "Shipped",
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
            text: "Pickup Point",
            value: 1
        },
        {
            text: "Home Delivery",
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
                <FilterSelect title={"Status"} btnText={"All Statuses"} itemsArr={statuses} openSelect={statusOpen} setOpenSelect={setStatusOpen} value={status} setValue={setStatus} />
                <FilterSelect title={"Couriers"} btnText={"All Couriers"} itemsArr={carriers} openSelect={carrierOpen} setOpenSelect={setCarrierOpen} value={carrier} setValue={setCarrier} />
                <FilterSelect title={"Delivery Method"} btnText={"All Methods"} itemsArr={deliveries} openSelect={deliveryOpen} setOpenSelect={setDeliveryOpen} value={delivery} setValue={setDelivery} />
                <DateInp title={"Date From"} />
                <DateInp title={"Date To"} />
            </div>
            <div className={styles.btnsWrap}>
                <button onClick={() => {
                    getOrdersByFilters()
                }}>
                    <img src={searchWhite} alt="" />
                    <p>Search</p>
                </button>
                <button onClick={() => { setClearFilter() }}>
                    Clear Filters
                </button>
            </div>
        </div>
    )
}

export default FilterBlock