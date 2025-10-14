import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useActionPayment } from "../../../hook/useActionPayment";

import styles from "./TestGls.module.scss";

const GlsWidget = ({ open, setOpen, onSelect, setIsNotChoose, sellerId }) => {

  const { setPointInfo } = useActionPayment()

  const payment = useSelector(state => state.payment)

  const { country } = useSelector(state => state.payment)


  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.parcelshop) {
        const ps = event.data.parcelshop.detail;
        setPointInfo(
          {
            pickup_point_id: ps.pclshopid,
            country: ps.ctrcode,
            street: ps.address,
            city: ps.city,
            zip: ps.zipcode,
            sellerId
          }
        )
        // setParcelShop({
        //   id: ps.pclshopid,
        //   name: ps.name,
        //   address: ps.address,
        //   zipcode: ps.zipcode,
        //   city: ps.city,
        //   country: ps.ctrcode,
        // });
        setOpen(false); // закрыть модалку после выбора
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // закрытие при клике вне модалки
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains(styles.modalOverlay)) {
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrapper}>

      {open && (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
          <div className={styles.modalContent}>
            <button
              className={styles.closeButton}
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <iframe
              src={`https://ps-maps.gls-czech.com?find=1&ctrcode=${country?.toUpperCase()}&lng=en&lngGls=en&closeBtn=1`}
              className={styles.mapFrame}
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlsWidget;