
import down from "../../../../assets/Seller/newOrder/down.svg"
import exp from "../../../../assets/Seller/newOrder/export.svg"
import whiteX from "../../../../assets/Seller/newOrder/whiteX.svg"


import styles from './DownLabelsBlock.module.scss';

const DownLabelsBlock = () => {
    return (
        <div className={styles.block}>
            <p className={styles.countText}>1 selected</p>
            <span className={styles.devidor}></span>

            <div className={styles.btnsWrap}>
                <button className={styles.downloadAndExportBtn}>
                    <img src={down} alt="" />
                    Download Labels
                </button>

                <button className={styles.downloadAndExportBtn}>
                    <img src={exp} alt="" />
                    Export
                </button>

                <button className={styles.closeBtn}>
                    <img src={whiteX} alt="" />
                </button>
            </div>



        </div>
    )
}

export default DownLabelsBlock