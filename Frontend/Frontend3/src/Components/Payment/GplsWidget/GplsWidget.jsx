import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useActionPayment } from "../../../hook/useActionPayment";

import styles from "./TestGls.module.scss";
import { ErrToast } from "../../../ui/Toastify";
import { ToastContainer } from "react-toastify";

const GlsWidget = ({ open, setOpen, setIsNotChoose, sellerId, selectedProviderPoint }) => {

  const { setPointInfo } = useActionPayment()

  const payment = useSelector(state => state.payment)

  const { country, paymentInfo } = useSelector(state => state.payment)


  const savePointInfo = (ps) => {
    setPointInfo({
      pickup_point_id: ps.pclshopid,
      country: ps.ctrcode,
      street: ps.address,
      city: ps.city,
      zip: ps.zipcode,
      sellerId
    });
  };

  useEffect(() => {
    if (!selectedProviderPoint) return; // защита от ""

    if (["glsShop", "glsBox"].includes(selectedProviderPoint)) {
      setOpen(true);
    }
  }, [selectedProviderPoint]);


  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.parcelshop) {
        const ps = event.data.parcelshop.detail;
        const isLocker = ps?.isparcellocker === "1" || ps?.isparcellocker === "t";

        console.log(ps?.isparcellocker, selectedProviderPoint);



        if (!isLocker && selectedProviderPoint === "glsShop") {
          savePointInfo(ps)
          setOpen(false); // закрыть модалку после выбора
        }
        else if (isLocker && selectedProviderPoint === "glsBox") {
          savePointInfo(ps)
          setOpen(false)
        }
        else {

          ErrToast(isLocker ? "This point is not a GLS Shop" : "This point is not a GLS Box");
          setIsNotChoose(true)
        }
      } else {
        setIsNotChoose(false)
      }
    };

    if (["glsShop", "glsBox"].includes(selectedProviderPoint)) {
      window.addEventListener("message", handleMessage);
    }

    return () => window.removeEventListener("message", handleMessage);
  }, [selectedProviderPoint]);

  // закрытие при клике вне модалки
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains(styles.modalOverlay)) {
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrapper}>

      {(open && selectedProviderPoint) && (
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
      <ToastContainer />
    </div>
  );
};

export default GlsWidget;