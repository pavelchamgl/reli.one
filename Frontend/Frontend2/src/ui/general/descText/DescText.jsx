import styles from "./DescText.module.scss"

const DescText = ({text, style}) => {
  return (
    <p style={style} className={styles.descText}>{text}</p>
  )
}

export default DescText