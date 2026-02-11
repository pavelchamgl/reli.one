import warehouseIc from "../../../../../assets/Seller/register/warehouseAndReturn.svg"
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"

import styles from "./WarehouseAndReturn.module.scss"

const WarehouseAndReturn = ({ data }) => {


    const nationalArr = [
        { text: "Czech Republic", value: "cz" },
        { text: "Germany", value: "de" },
        { text: "France", value: "fr" },
        { text: "Poland", value: "pl" },
        { text: "United Kingdom", value: "gb" }
    ];

    const wCountry = nationalArr.find((item) => item.value === data?.wCountry)
    const rCountry = nationalArr.find((item) => item.value === data?.rCountry)


    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={warehouseIc} alt="" />
                    <h3>Warehouse & Return</h3>
                </div>

                <EditBtn />
            </div>

            <div className={styles.firstBlock}>
                <p className={styles.title}>Warehouse Address</p>
                <span className={styles.desc}>{`${data?.wStreet}, ${data?.wCity}, ${wCountry.text}`}</span>
            </div>

            <div>
                <p className={styles.title}>Return Address</p>
                <span className={styles.desc}>{data?.same_as_warehouse ? "Same as warehouse address" : `${data?.rStreet}, ${data?.rCity}, ${rCountry.text}`}</span>
            </div>
        </div>
    )
}

export default WarehouseAndReturn