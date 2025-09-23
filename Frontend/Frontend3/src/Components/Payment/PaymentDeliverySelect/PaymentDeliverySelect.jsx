import { useEffect, useState } from "react";
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";

import arrRight from "../../../assets/Payment/arrRight.svg";
import arrBottom from "../../../assets/Payment/arrBottom.svg";
import paketa from "../../../assets/Payment/PaketaImage.svg";
import gls from "../../../assets/Payment/gls.png";
import styles from "./PaymentDeliverySelect.module.scss";
import PacketaWidget from "../PaketaWidget/PaketaWidget.jsx";
import { useSelector } from "react-redux";
import { useActionPayment } from "../../../hook/useActionPayment.js";
import { t } from "i18next";
import GlsWidget from "../GplsWidget/GplsWidget.jsx";

const PaymentDeliverySelect = ({ sellerId, group }) => {
  const [selectedValue, setSelectedValue] = useState(""); // группа (delivery_point / courier)
  const [selectedProviderPoint, setSelectedProviderPoint] = useState(""); // для delivery_point
  const [selectedProviderCourier, setSelectedProviderCourier] = useState(""); // для courier  
  const [openPoint, setOpenPoint] = useState(false);
  const [openDH, setOpenDH] = useState(false);
  const [paketaOpen, setPaketaOpen] = useState(false);
  const [glsOpen, setGlsOpen] = useState(false);

  const [paketaPointPrice, setPacketaPointPrice] = useState(null)
  const [paketaDHPrice, setPacketaDHPrice] = useState(null)
  const [glsPointPrice, setGlsPointPrice] = useState(null)
  const [glsDHPrice, setGlsDHPrice] = useState(null)


  const [isNotChoosePoint, setIsNotChoosePoint] = useState(false)

  const [pointPrice, setPointPrice] = useState(null)
  const [DHPrice, setDHPrice] = useState(null)

  const { deliveryCost, country, pointInfo } = useSelector(state => state.payment)
  const { setDeliveryType } = useActionPayment()

  const handleChange = (event) => {
    setSelectedValue(event.target.value);

  };

  useEffect(() => {
    const obj = {
      deliveryType: selectedValue,
      sellerId,
      deliveryPrice: selectedValue === "courier" ? DHPrice?.priceWithVat : pointPrice?.priceWithVat
    }

    setDeliveryType(obj)
  }, [selectedValue])

  useEffect(() => {
    if (!group?.couriers) return;

    // --- Zásilkovna ---
    const zasilkovna = group.couriers.zasilkovna;
    if (zasilkovna?.options?.length) {
      const pudo = zasilkovna.options.find(item => item.channel === "PUDO");
      const hd = zasilkovna.options.find(item => item.channel === "HD");

      console.log(pudo);


      if (pudo) setPacketaPointPrice(pudo);
      if (hd) setPacketaDHPrice(hd);
    } else if (zasilkovna?.error) {
      console.error("Zásilkovna error:", zasilkovna.error);
      setPacketaPointPrice(null);
      setPacketaDHPrice(null);
    }

    // --- GLS ---
    const gls = group.couriers.gls;
    if (gls?.options?.length) {
      const pudo = gls.options.find(item => item.channel === "PUDO");
      const hd = gls.options.find(item => item.channel === "HD");

      console.log(pudo);


      if (pudo) setGlsPointPrice(pudo.priceWithVat);
      if (hd) setGlsDHPrice(hd.priceWithVat);
    } else if (gls?.error) {
      console.error("GLS error:", gls.error);
      setGlsPointPrice(null);
      setGlsDHPrice(null);
    }
  }, [group]);


  useEffect(() => {
    console.log(pointPrice, DHPrice);

  }, [pointPrice, DHPrice])

  useEffect(() => {
    if (isNotChoosePoint) {
      setSelectedValue(null)
      setIsNotChoosePoint(false)
    }

  }, [setIsNotChoosePoint])




  if (paketaPointPrice || paketaDHPrice || glsDHPrice || glsPointPrice) {
    return (
      <div>
        <FormControl fullWidth>
          <RadioGroup
            name="delivery-method"
            value={selectedValue}
            onChange={handleChange}
          >
            {/* Delivery Point Group */}
            <button
              type="button"
              onClick={() => setOpenPoint((prev) => !prev)}
              className={styles.selectBlock}
            >
              <div className={styles.radioImageDiv}>
                <FormControlLabel
                  sx={{ marginRight: "0px" }}
                  value="delivery_point"
                  control={<Radio color="success" />}
                />
                {selectedValue === "delivery_point"
                  ? (
                    <span>
                      {selectedProviderPoint === "packeta" && <img src={paketa} alt="Packeta" />}
                      {selectedProviderPoint === "gls" && <img src={gls} alt="GLS" />}
                    </span>
                  )
                  : <p className={styles.labelText}>{t("payment_page.delivery_point")}</p>}
              </div>
              <img src={openPoint ? arrBottom : arrRight} alt="" />
            </button>

            <div className={openPoint ? styles.selectBlockAcc : styles.selectBlockNotAcc}>
              {/* Packeta */}
              <div
                className={styles.selectBlock}
                onClick={() => {
                  if (!paketaPointPrice) return
                  setSelectedValue("delivery_point");
                  setSelectedProviderPoint("packeta");
                  setPaketaOpen(!paketaOpen);
                  setOpenPoint(false);
                }}
              >
                <div className={styles.radioImageDiv}>
                  <FormControlLabel
                    value="delivery_point"
                    control={<Radio color="success"
                      disabled={!paketaPointPrice}
                    // checked={selectedProviderPoint === "packeta"} 
                    />}
                    label={<img src={paketa} alt="Packeta" />}
                  />
                </div>
                <p className={styles.price}>{paketaPointPrice ? paketaPointPrice?.priceWithVat : "Delivery not available"} €</p>
              </div>

              {/* GLS */}
              <div
                className={styles.selectBlock}
                onClick={() => {
                  if (!glsPointPrice) return
                  setSelectedValue("delivery_point");
                  setSelectedProviderPoint("gls");
                  setGlsOpen(true);
                  if (window.findGlsPs) window.findGlsPs();
                  setOpenPoint(false);
                }}
              >
                <div className={styles.radioImageDiv}>
                  <FormControlLabel
                    value="delivery_point"
                    control={<Radio color="success"
                    // checked={selectedProviderPoint === "gls"}
                    />}
                    disabled={!glsPointPrice}
                    label={<img src={gls} alt="GLS" />}
                  />
                </div>
                <p className={styles.price}>{glsPointPrice ? glsPointPrice?.priceWithVat : "Delivery not available"} €</p>
              </div>
            </div>

            {/* Courier Delivery Group */}
            <button
              type="button"
              onClick={() => setOpenDH((prev) => !prev)}
              className={styles.selectBlock}
            >
              <div className={styles.radioImageDiv}>
                <FormControlLabel
                  sx={{ marginRight: "0px" }}
                  value="courier"
                  control={<Radio color="success" />}

                />
                {selectedValue === "courier"
                  ? (
                    <span>
                      {selectedProviderCourier === "packeta" && <img src={paketa} alt="Packeta" />}
                      {selectedProviderCourier === "gls" && <img src={gls} alt="GLS" />}
                    </span>
                  )
                  : <p className={styles.labelText}>{t("payment_page.courier_delivery")}</p>}

              </div>
              <img src={openDH ? arrBottom : arrRight} alt="" />
            </button>

            <div className={openDH ? styles.selectBlockAcc : styles.selectBlockNotAcc}>
              {/* packeta */}
              <div
                className={styles.selectBlock}
                onClick={() => {
                  if (!paketaDHPrice) return
                  setSelectedValue("courier");
                  setSelectedProviderCourier("packeta");
                  setPaketaOpen(!paketaOpen);
                  setOpenDH(false)
                }}
              >
                <div className={styles.radioImageDiv}>
                  <FormControlLabel
                    value="courier"
                    control={<Radio color="success"
                      disabled={!paketaDHPrice}
                    // checked={selectedProviderCourier === "packeta"} 
                    />}
                    label={<img src={paketa} alt="Packeta" />}
                  />
                </div>
                <p className={styles.price}>{paketaDHPrice ? paketaDHPrice?.priceWithVat : "Delivery not available"} €</p>
              </div>

              {/* GLS */}
              <div
                className={styles.selectBlock}
                onClick={() => {
                  if (!glsDHPrice) return
                  setSelectedValue("courier");
                  setSelectedProviderCourier("gls");
                  setGlsOpen(true);
                  if (window.findGlsPs) window.findGlsPs();
                  setOpenPoint(false);
                }}
              >
                <div className={styles.radioImageDiv}>
                  <FormControlLabel
                    value="courier"
                    disabled={!glsDHPrice}
                    control={<Radio color="success"
                    // checked={selectedProviderCourier === "gls"} 
                    />}
                    label={<img src={gls} alt="GLS" />}
                  />
                </div>
                <p className={styles.price}>{glsDHPrice ? glsDHPrice?.priceWithVat : "Delivery not available"} €</p>
              </div>
            </div>
          </RadioGroup>
        </FormControl>

        <GlsWidget
          sellerId={sellerId}
          open={glsOpen}
          setOpen={setGlsOpen}
          setIsNotChoose={setIsNotChoosePoint}
          onSelect={(point) => {
            console.log(point);
          }}
        />
        <PacketaWidget setIsNotChoose={setIsNotChoosePoint} sellerId={sellerId} open={paketaOpen} setOpen={setPaketaOpen} />
      </div>
    );
  }

};

export default PaymentDeliverySelect;
