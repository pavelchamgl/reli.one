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
  num,
  digitsOnly = false,
  decimal = false,
  disabled = false,
  placeholder
}) => {
  const titleClass =
    titleSize === "big"
      ? required
        ? styles.titleBRequired
        : styles.titleBig
      : required
        ? styles.titleSRequired
        : styles.titleSmall;

  const handleInputChange = (event) => {
    let { value } = event.target;

    if (decimal) {
      value = value.replace(/[^0-9.,]/g, "");
      event.target.value = value;
    } else if (digitsOnly) {
      value = value.replace(/\D/g, "");
      event.target.value = value;
    } else if (num && value.includes("-")) {
      return;
    }

    handleChange(event);
  };

  return (
    <label style={style} className={error ? styles.labelErr : styles.label}>
      <p className={titleClass}>{text}</p>
      {textarea
        ? <textarea
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          style={{ fontFamily: (num || digitsOnly || decimal) ? "var(--ft)" : undefined }}
        />
        :
        <input
          name={name}
          value={value}
          onBlur={handleBlur}
          onChange={handleInputChange}
          type="text"
          placeholder={placeholder}
          disabled={disabled}
          style={{ fontFamily: (num || digitsOnly || decimal) ? "var(--ft)" : undefined }}
        />
      }
      <p className={styles.errText} translate="no" hidden={!error}>{error || ""}</p>
    </label>
  );
};

export default CreateFormInp;
