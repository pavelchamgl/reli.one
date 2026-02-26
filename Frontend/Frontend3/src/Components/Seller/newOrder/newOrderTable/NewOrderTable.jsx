import React from 'react'

import styles from "./NewOrderTable.module.scss"
import Checkbox from '../../../../ui/Seller/newOrder/checkbox/Checkbox'
import TableItem from '../tableItem/TableItem'
import { useSelector } from 'react-redux'
import { useActionNewOrder } from '../../../../hook/useActionNewOrder'

const NewOrderTable = ({ data }) => {

    const tableTitleTexts = [
        {
            text: "Order ID",
            width: 168
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
            width: 129,
            pad: "0 0"
        },
        {
            text: "Dispatch Before",
            width: 133,
            break: 60,
            textAlign: "left",
        },
        {
            text: "Actions",
            width: 152,
            pad: "0 0"
        }

    ]

    console.log(data);

    const { selectedIds } = useSelector(state => state.newOrder);
    const { clearAll, selectAll } = useActionNewOrder()


    const allSelected = data.length > 0 && selectedIds.length === data.length;
    const partiallySelected =
        selectedIds.length > 0 && selectedIds.length < data.length;



    const handleMainCheckbox = () => {
        if (allSelected) {
            clearAll();
        } else {
            selectAll();
        }
    };

    return (
        <div className={styles.tableWrap}>
            <div className={styles.titleWrap}>
                <Checkbox
                    checked={allSelected}
                    indeterminate={partiallySelected}
                    onChange={handleMainCheckbox}
                />
                {
                    tableTitleTexts.map((textObj) => (
                        <div className={styles.titleTextWrap} style={{ minWidth: `${textObj.width}px`, textAlign: textObj.textAlign, justifyContent: textObj.justify, padding: textObj?.text === "Status" || textObj.text === "Actions" ? textObj?.pad : "" }}>
                            <p className={`${styles.titleText}`}
                                style={{ textAlign: textObj.textAlign, width: `${textObj.break}px` }}
                            >{textObj.text}</p>
                        </div>
                    ))
                }
            </div>
            {
                data.map((item) => (
                    <TableItem data={item} />
                ))
            }
            {/* <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem />
            <TableItem /> */}
        </div>
    )
}

export default NewOrderTable