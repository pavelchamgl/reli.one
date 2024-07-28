import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import addImageIcon from "../../../assets/Product/AddImageIcon.svg";
import FormImageIcon from "../../../assets/Product/FormImageIcon.svg";

import styles from "./CreateResenzeImage.module.scss";

const CreateResenzeImage = ({}) => {
  const { t } = useTranslation();

  const [imageUrls, setImageUrls] = useState([]);
  const [files, setFiles] = useState([]);

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrls((prevImageUrls) => [...prevImageUrls, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };


  return (
    <div className={styles.imageWrap}>
      <label className={styles.addBtn}>
        <img src={addImageIcon} alt="" />
        <p>{t("add_photo")}</p>
        <input
          className={styles.inpHidden}
          onChange={handleFileChange}
          type="file"
          accept="image/*"
        />
      </label>
      <div className={styles.imageDiv}>
        <label>
          <p>+</p>
          <input
            className={styles.inpHidden}
            onChange={handleFileChange}
            type="file"
            accept="image/*"
          />
        </label>
        {imageUrls.map((item) => (
          <div>
            <img src={item} alt="" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreateResenzeImage;
