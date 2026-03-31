import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { useActionNewOrder } from '../../../../hook/useActionNewOrder'
import Checkbox from '../../../../ui/Seller/newOrder/checkbox/Checkbox'
import TableItem from '../tableItem/TableItem'

import styles from "./NewOrderTable.module.scss"

const NewOrderTable = ({ data }) => {

    const { t } = useTranslation('sellerOrder')


    const tableTitleTexts = [
        {
            text: t("orderId"),
            width: 168
        },
        {
            text: t('created'),
            width: 138
        },
        {
            text: t("products"),
            width: 89
        },
        {
            text: t('purchaseExclVat'),
            width: 151,
            break: 103,
            textAlign: "right",
            justify: "right"
        },
        {
            text: t('salesInclVat'),
            width: 123,
            break: 83,
            textAlign: "right",
            justify: "right"
        },
        {
            text: t('totalWithDelivery'),
            width: 127,
            break: 60,
            textAlign: "right",
            justify: "right"
        },
        {
            text: t("status"),
            width: 129,
            pad: "0 0"
        },
        {
            text: t('dispatchBefore'),
            width: 133,
            break: 60,
            textAlign: "left",
        },
        {
            text: t("actions"),
            width: 152,
            pad: "0 0"
        }

    ]


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