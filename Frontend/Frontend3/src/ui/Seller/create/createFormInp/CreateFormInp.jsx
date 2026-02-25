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
  error,
  num
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
    <label style={style} className={error ? styles.labelErr : styles.label}>
      <p className={titleClass}>{text}</p>
      {textarea
        ? <textarea
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{ fontFamily: num ? "var(--ft)" : "" }}
        />
        :
        <input
          name={name}
          value={value}
          onBlur={handleBlur}
          onChange={handleChange}
          type="text"
          style={{ fontFamily: num ? "var(--ft)" : "" }}
        />
      }
      {error ? <p className={styles.errText}>{error}</p> : <></>}
    </label>
  );
};

export default CreateFormInp;
