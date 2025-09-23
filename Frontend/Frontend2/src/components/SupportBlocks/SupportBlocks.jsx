
import linkArr from "../../assets/sellerSupport/linkArrow.svg"

import styles from "./SupportBlocks.module.scss"

const Block = ({ item }) => {

    return (
        <div style={item?.style} className={styles.blockWrap}>
            <img src={item?.img} alt="" />
            <div style={item?.textStyle}>
                <h5>{item?.title}</h5>
                <p>{item?.desc}</p>
            </div>
            {item?.link && <a href="#">{item?.link} <img src={linkArr} alt="" /></a>}
        </div>
    )
}

const SupportBlocks = ({ title, desc, blocks }) => {
    return (
        <div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.desc}>{desc}</p>
            <div className={styles.blocksWrap}>
                {
                    blocks.map((item) => (
                        <Block item={item} />
                    ))
                }
            </div>
        </div>
    )
}

export default SupportBlocks