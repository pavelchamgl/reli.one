import styles from "./Container.module.scss"

const Container = ({children}) => {
  return (
    <div className={styles.main}>{children}</div>
  )
}

export default Container