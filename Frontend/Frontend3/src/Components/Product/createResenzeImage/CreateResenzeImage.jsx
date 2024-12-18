import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import addImageIcon from "../../../assets/Product/AddImageIcon.svg";
import deleteCommentImage from "../../../assets/Product/deleteCommentImage.svg";

import styles from "./CreateResenzeImage.module.scss";

const CreateResenzeImage = ({ setMainFiles }) => {
  const { t } = useTranslation();

  const [imageUrls, setImageUrls] = useState([]);
  const [files, setFiles] = useState([]);
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (index) => {
    // Удаляем изображение из imageUrls
    const updatedImageUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updatedImageUrls);

    // Удаляем соответствующий файл из files
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setMainFiles(updatedFiles); // Обновляем setMainFiles с актуальным списком файлов
  };

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    setMainFiles(updatedFiles);

    newFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      setImageUrls((prevImageUrls) => [...prevImageUrls, url]);
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
          accept="image/*,video/*"
          multiple
        />
      </label>
      <div className={styles.imageDiv}>
        <label>
          <p>+</p>
          <input
            className={styles.inpHidden}
            onChange={handleFileChange}
            type="file"
            accept="image/*,video/*"
            multiple
          />
        </label>
        {files.map((file, index) => {
          const isVideo = file.type.startsWith("video/"); // Проверяем MIME-тип файла

          console.log(imageUrls);

          return (
            <div
              key={index}
              className={styles.imageListWrap}
              onMouseEnter={(e) =>
                e.currentTarget.classList.add(styles.hovered)
              }
              onMouseLeave={(e) =>
                e.currentTarget.classList.remove(styles.hovered)
              }
            >
              <div className={styles.deleteButton}>
                <button onClick={() => handleDelete(index)}>
                  <img src={deleteCommentImage} alt="delete" />
                </button>
              </div>

              {isVideo ? (
                <video muted autoPlay loop className={styles.mediaPreview}>
                  <source src={imageUrls[index]} type={file.type} />
                  Ваш браузер не поддерживает элемент видео.
                </video>
              ) : (
                <img
                  src={imageUrls[index]}
                  alt="preview"
                  className={styles.mediaPreview}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CreateResenzeImage;
