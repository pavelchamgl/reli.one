import React from 'react'

import truck from "../../../../assets/Seller/orderDetal/truck.svg"
import down from "../../../../assets/Seller/orderDetal/down.svg"
import dock from "../../../../assets/Seller/orderDetal/dock.svg"
import xWhite from "../../../../assets/Seller/orderDetal/xWhite.svg"

import styles from './ActionsBlock.module.scss';

const ActionsBlock = () => {

    return (
        <div className={styles.actionBlock}>

            <h4 className={styles.title}>Actions</h4>

            <button>
                <img src={down} alt="" />
                <p>Download Label</p>
            </button>
            <button>
                <img src={truck} alt="" />
                <p>Track Shipment</p>
            </button>
            <button>
                <img src={dock} alt="" />
                <p>Export Invoice</p>
            </button>
            <button>
                <img src={xWhite} alt="" />
                <p>Cancel Order</p>
            </button>

        </div>
    )
}

export default ActionsBlock