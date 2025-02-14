import styles from "./CreateFormInp.module.scss";

const CreateFormInp = ({
  text,
  titleSize = "small",
  required = false,
  textarea = false,
  style,
  handleChange,
  handleBlur,
  name,
  value,
  error
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
      {textarea
        ? <textarea name={name} value={value} onChange={handleChange} onBlur={handleBlur} />
        : <input name={name} value={value} onBlur={handleBlur} onChange={handleChange} type="text" />}
    </label>
  );
};

export default CreateFormInp;
