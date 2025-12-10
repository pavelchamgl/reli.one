import { Link } from "react-router-dom"
import StatusText from '../../all/statusText/StatusText'
import Checkbox from '../../../../ui/Seller/newOrder/checkbox/Checkbox'

import prodIc from "../../../../assets/Seller/newOrder/productIc.svg"

import styles from './TableItem.module.scss';
import ActionBtns from "../actionBtns/ActionBtns";

const TableItem = () => {
    return (
        <div className={styles.tableWrap}>
            <Checkbox />
            <Link className={styles.orderlink} to={"#"}>ORD-2025-001</Link>
            <p className={`${styles.date} ${styles.greyText}`}>2025-11-27 10:30</p>
            <p className={styles.prodWrap}>
                <img src={prodIc} alt="" />
                3
            </p>
            <p className={`${styles.prodWrap} ${styles.price}`} style={{ minWidth: "151px" }}>$125.50</p>
            <p className={`${styles.prodWrap} ${styles.price}`} style={{ minWidth: "123px" }}>$189.00</p>
            <p className={`${styles.prodWrap} ${styles.price}`} style={{ minWidth: "127px" }}>$199.00</p>
            <StatusText status={"Pending"} />
            <p className={`${styles.prodWrap} ${styles.date}`} style={{ minWidth: "133px" }}>2025-11-28</p>
            <ActionBtns />
        </div>
    )
}

export default TableItem