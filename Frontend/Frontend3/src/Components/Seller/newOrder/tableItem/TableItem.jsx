import { Link } from "react-router-dom"
import { useSelector } from "react-redux";

import StatusText from '../../all/statusText/StatusText'
import Checkbox from '../../../../ui/Seller/newOrder/checkbox/Checkbox'

import prodIc from "../../../../assets/Seller/newOrder/productIc.svg"

import styles from './TableItem.module.scss';
import ActionBtns from "../actionBtns/ActionBtns";
import { useActionNewOrder } from "../../../../hook/useActionNewOrder";

const TableItem = ({ data }) => {
    console.log(data);

    const { selectedIds } = useSelector(state => state.newOrder);

    const isChecked = selectedIds.includes(data?.id);

    const { toggleOrder } = useActionNewOrder()

    return (
        <div className={styles.tableWrap}>
            <Checkbox
                checked={isChecked}
                onChange={() => toggleOrder(data?.id)}
            />
            <Link className={styles.orderlink} to={`/seller/seller-order-detal/${data?.id}`}>{data?.order_number}</Link>
            <p className={`${styles.date} ${styles.greyText}`}>{data?.order_date}</p>
            <p className={styles.prodWrap}>
                <img src={prodIc} alt="" />
                {data?.products_count}
            </p>
            <p className={`${styles.prodWrap} ${styles.price}`} style={{ minWidth: "151px" }}>{data?.purchase_excl_vat} €</p>
            <p className={`${styles.prodWrap} ${styles.price}`} style={{ minWidth: "123px" }}>{data?.sales_incl_vat} €</p>
            <p className={`${styles.prodWrap} ${styles.price}`} style={{ minWidth: "127px" }}>{data?.total_incl_vat_plus_delivery} €</p>
                <StatusText status={data?.status} />
            <p className={`${styles.prodWrap} ${styles.date}`} style={{ minWidth: "133px" }}>{data?.dispatch_before ? data?.dispatch_before : "Pending"}</p>
            <ActionBtns data={data} />
        </div>
    )
}

export default TableItem