import styles from "./CreateFormInp.module.scss";

const CreateFormInp = ({
  text,
  titleSize = "small",
  required = false,
  textarea = false,
  style,
}) => {
  const titleClass =
    titleSize === "big"
      ? required
        ? styles.titleBRequired
        : styles.titleBig
      : required
      ? styles.titleSRequired
      : styles.titleSmall;

  return (
    <label style={style} className={styles.label}>
      <p className={titleClass}>{text}</p>
      {textarea ? <textarea /> : <input type="text" />}
    </label>
  );
};

export default CreateFormInp;
