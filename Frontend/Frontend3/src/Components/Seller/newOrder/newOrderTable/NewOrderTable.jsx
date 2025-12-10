import React from 'react'

import styles from "./NewOrderTable.module.scss"
import Checkbox from '../../../../ui/Seller/newOrder/checkbox/Checkbox'
import TableItem from '../tableItem/TableItem'

const NewOrderTable = () => {

    const tableTitleTexts = [
        {
            text: "Order ID",
            width: 128
        },
        {
            text: "Created",
            width: 138
        },
        {
            text: "Products",
            width: 89
        },
        {
            text: "Purchase excl. VAT",
            width: 151,
            break: 103,
            textAlign: "right",
            justify: "right"
        },
        {
            text: "Sales incl. VAT",
            width: 123,
            break: 83,
            textAlign: "right",
            justify: "right"
        },
        {
            text: "Total + Delivery",
            width: 127,
            break: 60,
            textAlign: "right",
            justify: "right"
        },
        {
            text: "Status",
            width: 129
        },
        {
            text: "Dispatch Before",
            width: 133,
            break: 60,
            textAlign: "left",
        },
        {
            text: "Actions",
            width: 152
        }

    ]

    return (
        <div className={styles.tableWrap}>
            <div className={styles.titleWrap}>
                <Checkbox />
                {
                    tableTitleTexts.map((textObj) => (
                        <div className={styles.titleTextWrap} style={{ minWidth: `${textObj.width}px`, textAlign: textObj.textAlign, justifyContent: textObj.justify }}>
                            <p className={`${styles.titleText}`}
                                style={{ textAlign: textObj.textAlign, width: `${textObj.break}px` }}
                            >{textObj.text}</p>
                        </div>
                    ))
                }
            </div>
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
        </div>
    )
}

export default NewOrderTable