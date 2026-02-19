import warehouseIc from "../../../../../assets/Seller/register/warehouseAndReturn.svg"
import { countriesArr } from "../../../../../code/seller";
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"

import styles from "./WarehouseAndReturn.module.scss"

const WarehouseAndReturn = ({ data, setOpen }) => {



    const wCountry = countriesArr.find((item) => item.value === data?.wCountry)
    const rCountry = countriesArr.find((item) => item.value === data?.rCountry)


    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={warehouseIc} alt="" />
                    <h3>Warehouse & Return</h3>
                </div>

                <EditBtn setOpen={setOpen} />
            </div>

            <div className={styles.firstBlock}>
                <div>
                    <p className={styles.title}>Warehouse Address</p>
                    <span className={styles.desc}>{`${data?.wStreet}, ${data?.wCity}, ${wCountry?.text}, ${data?.wZip_code}`}</span>
                </div>
                <div>
                    <p className={styles.title}>Contact phone</p>
                    <span className={`${styles.desc} ${styles.num}`}>{`${data?.contact_phone}`}</span>
                </div>
            </div>


            <div className={styles.lastBlock}>

                {
                    data?.same_as_warehouse ?

                        <div>
                            <p className={styles.title}>Return Address</p>
                            <span className={styles.desc}>{"Same as warehouse address"}</span>
                        </div>

                        :

                        <>
                            <div>
                                <p className={styles.title}>Return Address</p>
                                <span className={styles.desc}>{data?.same_as_warehouse ? "Same as warehouse address" : `${data?.rStreet}, ${data?.rCity}, ${rCountry?.text}, ${data?.rZip_code}`}</span>
                            </div>

                            <div>
                                <p className={styles.title}>Contact phone</p>
                                <span className={styles.desc}>{data?.rContact_phone}</span>
                            </div>
                        </>
                }


            </div>
        </div>
    )
}

export default WarehouseAndReturn