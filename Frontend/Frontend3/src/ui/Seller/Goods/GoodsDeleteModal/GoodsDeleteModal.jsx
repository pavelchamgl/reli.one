import { useRef, useEffect } from "react";

import xIcon from "../../../../assets/loginModal/loginModalX.svg";

import styles from "./GoodsDeleteModal.module.scss";
import { deleteSellerProduct } from "../../../../api/seller/sellerProduct";
import { ErrToast } from "../../../Toastify";
import { useActionSellerList } from "../../../../hook/useActionSellerList";

const GoodsDeleteModal = ({ open, handleClose, item }) => {
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

  const { filterProducts } = useActionSellerList()

  const handleDelete = async () => {
    try {
      const res = await deleteSellerProduct(item?.id)
      console.log(res);
      filterProducts({ id: item?.id })
      handleClose()

    } catch (error) {
      if (error?.response?.status === 404 || error?.response?.status === 401) {
        ErrToast(error?.response?.data?.detail)
      } else {
        ErrToast("An unknown error")
      }

    }
  }

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
          <button onClick={() => handleDelete()}>Yes</button>
          <button onClick={handleClose}>No</button>
        </div>
      </div>
    </dialog>
  );
};

export default GoodsDeleteModal;
