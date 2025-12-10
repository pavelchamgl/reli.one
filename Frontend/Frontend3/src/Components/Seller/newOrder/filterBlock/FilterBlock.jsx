import { useState } from 'react'
import SearchInp from '../../../../ui/Seller/newOrder/searchInp/SearchInp'
import FilterSelect from '../../../../ui/Seller/newOrder/filterSelect/FilterSelect'
import DateInp from '../../../../ui/Seller/newOrder/dateInp/DateInp'

import searchWhite from "../../../../assets/Seller/newOrder/searchWhite.svg"

import styles from './FilterBlock.module.scss';

const FilterBlock = () => {

    const [status, setStatus] = useState("")
    const [statusOpen, setStatusOpen] = useState()

    const [carrier, setCarrier] = useState("")
    const [carrierOpen, setCarrierOpen] = useState()

    const [delivery, setDelivery] = useState("")
    const [deliveryOpen, setDeliveryOpen] = useState()

    const statuses = [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"
    ]

    const carriers = [
        "DPD",
        "DHL Express",
        "FedEx",
        "UPS"
    ]

    const deliveries = [
        "Express Delivery",
        "Pickup Point",
        "Standard Delivery"
    ]

    return (
        <div className={styles.filterBlock}>
            <div className={styles.filterWrap}>
                <SearchInp />
                <FilterSelect title={"Status"} btnText={"All Statuses"} itemsArr={statuses} openSelect={statusOpen} setOpenSelect={setStatusOpen} value={status} setValue={setStatus} />
                <FilterSelect title={"Carrier"} btnText={"All Carriers"} itemsArr={carriers} openSelect={carrierOpen} setOpenSelect={setCarrierOpen} value={carrier} setValue={setCarrier} />
                <FilterSelect title={"Delivery Method"} btnText={"All Methods"} itemsArr={deliveries} openSelect={deliveryOpen} setOpenSelect={setDeliveryOpen} value={delivery} setValue={setDelivery} />
                <DateInp title={"Date From"} />
                <DateInp title={"Date To"} />
            </div>
            <div className={styles.btnsWrap}>
                <button>
                    <img src={searchWhite} alt="" />
                    <p>Search</p>
                </button>
                <button>
                    Clear Filters
                </button>
            </div>
        </div>
    )
}

export default FilterBlock