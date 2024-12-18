import { useRef, useEffect } from "react";

import xIcon from "../../../../assets/loginModal/loginModalX.svg";

import styles from "./GoodsDeleteModal.module.scss";

const GoodsDeleteModal = ({ open, handleClose }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const handleDialogClick = (e) => {
    // Проверяем, был ли клик на самом элементе <dialog>
    if (e.target === dialogRef.current) {
      handleClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      onClick={handleDialogClick}
    >
      <div className={styles.content}>
        <button onClick={handleClose} className={styles.closeBtn}>
          <img src={xIcon} alt="" />
        </button>
        <h3>Are you sure you want to remove the item?</h3>
        <div className={styles.btnsDiv}>
          <button>Yes</button>
          <button onClick={handleClose}>No</button>
        </div>
      </div>
    </dialog>
  );
};

export default GoodsDeleteModal;
