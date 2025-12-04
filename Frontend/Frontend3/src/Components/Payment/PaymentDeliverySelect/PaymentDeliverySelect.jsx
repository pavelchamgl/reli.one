import { useEffect, useState } from "react";
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { t } from "i18next";
import { useSelector } from "react-redux";
import { useActionPayment } from "../../../hook/useActionPayment.js";

import arrRight from "../../../assets/Payment/arrRight.svg";
import arrBottom from "../../../assets/Payment/arrBottom.svg";
import paketa from "../../../assets/Payment/PaketaImage.svg";
import gls from "../../../assets/Payment/gls.png";
import dpd from "../../../assets/Payment/dpdIc.svg";

import PacketaWidget from "../PaketaWidget/PaketaWidget.jsx";
import GlsWidget from "../GplsWidget/GplsWidget.jsx";
import DpdPickupWidget from "../DpdPickupWidget/DpdPickupWidget.jsx";

import styles from "./PaymentDeliverySelect.module.scss";

const PaymentDeliverySelect = ({ sellerId, group }) => {
  const [selectedValue, setSelectedValue] = useState(""); // группа (delivery_point / courier)
  const [selectedProviderPoint, setSelectedProviderPoint] = useState(null); // для delivery_point
  const [selectedProviderCourier, setSelectedProviderCourier] = useState(""); // для courier  
  const [openPoint, setOpenPoint] = useState(false);
  const [openDH, setOpenDH] = useState(false);
  const [paketaOpen, setPaketaOpen] = useState(false);
  const [glsOpen, setGlsOpen] = useState(false);
  const [dpdOpen, setDpdOpen] = useState(false);

  const [paketaPointPrice, setPacketaPointPrice] = useState(null)
  const [paketaDHPrice, setPacketaDHPrice] = useState(null)
  const [glsShopPointPrice, setGlsShopPointPrice] = useState(null)
  const [glsBoxPointPrice, setGlsBoxPointPrice] = useState(null)
  const [glsDHPrice, setGlsDHPrice] = useState(null)
  const [dpdPointPrice, setDpdPointPrice] = useState(null)
  const [dpdDHPrice, setDpdDHPrice] = useState(null)

  const [isNotChoosePoint, setIsNotChoosePoint] = useState(false)

  const { deliveryCost, country, pointInfo } = useSelector(state => state.payment)
  const { setDeliveryType, editValue } = useActionPayment()

  const handleChange = (event) => {
    setSelectedValue(event.target.value);

  };

  useEffect(() => {
    const price = (() => {
      if (selectedValue === "courier") {
        if (selectedProviderCourier === "gls") return glsDHPrice?.priceWithVat;
        if (selectedProviderCourier === "packeta") return paketaDHPrice?.priceWithVat;
        if (selectedProviderCourier === "dpd") return dpdDHPrice?.priceWithVat;
      } else {
        if (selectedProviderPoint === "glsBox") return glsBoxPointPrice?.priceWithVat;
        if (selectedProviderPoint === "glsShop") return glsShopPointPrice?.priceWithVat;
        if (selectedProviderPoint === "packeta") return paketaPointPrice?.priceWithVat;
        if (selectedProviderPoint === "dpd") return dpdPointPrice?.priceWithVat;
      }
      return null;
    })();

    let deliveryMode = null;

    if (selectedValue === "delivery_point") {
      const map = {
        glsShop: "shop",
        glsBox: "box",
      };

      deliveryMode = map[selectedProviderPoint] ?? null;
    }

    editValue({
      deliveryMethodPoint: selectedProviderPoint,
      deliveryMethodDH: selectedProviderCourier,
    })


    const obj = {
      deliveryType: selectedValue,
      sellerId,
      deliveryPrice: price,

      deliveryMode

    };


    console.log(
      paketaPointPrice,
      paketaDHPrice,
      glsDHPrice,
      glsBoxPointPrice,
      glsShopPointPrice,
      dpdDHPrice,
      dpdPointPrice
    );


    setDeliveryType(obj);
  }, [
    selectedValue,
    sellerId,
    selectedProviderCourier,
    selectedProviderPoint,
    glsDHPrice,
    paketaDHPrice,
    glsBoxPointPrice,
    glsShopPointPrice,
    paketaPointPrice,
    dpdPointPrice,
    dpdDHPrice
  ]);


  useEffect(() => {
    console.log(group);

  }, [])


  useEffect(() => {
    if (!group?.couriers) return;

    console.log(group?.couriers);


    console.log(group);


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
      const box = gls.options.find(item => item.service === "BOX");
      const shop = gls.options.find(item => item.service === "SHOP");
      const hd = gls.options.find(item => item.channel === "HD");
      if (box) setGlsBoxPointPrice(box);
      if (shop) setGlsShopPointPrice(shop);
      if (hd) setGlsDHPrice(hd);
    } else if (gls?.error) {
      console.error("GLS error:", gls.error);
      setGlsBoxPointPrice(null);
      setGlsShopPointPrice(null);
      setGlsDHPrice(null);
    }


    const dpd = group.couriers.dpd;
    if (dpd?.options?.length) {
      const pudo = dpd.options.find(item => item.channel === "PUDO");
      const hd = dpd.options.find(item => item.channel === "HD");

      if (pudo) setDpdPointPrice(pudo);
      if (hd) setDpdDHPrice(hd);
    } else if (dpd?.error) {
      console.error("DPD error:", dpd.error);
      setDpdPointPrice(null);
      setDpdDHPrice(null);
    }
  }, [group]);


  useEffect(() => {
    if (isNotChoosePoint) {
      setSelectedValue(null)
      setIsNotChoosePoint(false)
    }

  }, [setIsNotChoosePoint])


  const prices = [
    paketaPointPrice,
    paketaDHPrice,
    glsDHPrice,
    glsBoxPointPrice,
    glsShopPointPrice,
    dpdDHPrice,
    dpdPointPrice
  ];



  if (prices.some(price => price != null)) {
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
                      {selectedProviderPoint === "glsBox" && (
                        <div className={styles.glsPointLabelWrap}>
                          <img src={gls} alt="GLS" />
                          <p>Box</p>
                        </div>
                      )}
                      {selectedProviderPoint === "glsShop" && (
                        <div className={styles.glsPointLabelWrap}>
                          <img src={gls} alt="GLS" />
                          <p>Shop</p>
                        </div>
                      )}
                      {selectedProviderPoint === "dpd" && <img src={dpd} alt="DPD" />}
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
                      checked={selectedProviderPoint === "packeta"}
                    />}
                    label={<img src={paketa} alt="Packeta" />}
                  />
                </div>
                <p className={styles.price}>{paketaPointPrice ? `${paketaPointPrice?.priceWithVat} €` : "Delivery not available"}</p>
              </div>

              {/* GLS */}
              <div
                className={styles.selectBlock}
                onClick={() => {
                  if (!glsBoxPointPrice) return
                  setSelectedValue("delivery_point");
                  setSelectedProviderPoint("glsBox");
                  // if (selectedProviderPoint === "glsBox") {
                  //   setGlsOpen(true);
                  // }
                }}
              >
                <div className={styles.radioImageDiv}>
                  <FormControlLabel
                    value="delivery_point"
                    control={<Radio color="success"
                      checked={selectedProviderPoint === "glsBox"}
                    />}
                    disabled={!glsBoxPointPrice}
                    label={
                      <div className={styles.glsPointLabelWrap}>
                        <img src={gls} alt="GLS" />
                        <p>Box</p>
                      </div>
                    }
                  />
                </div>
                <p className={styles.price}>{glsBoxPointPrice ? `${glsBoxPointPrice?.priceWithVat} €` : "Delivery not available"}</p>
              </div>

              <div
                className={styles.selectBlock}
                onClick={() => {
                  if (!glsShopPointPrice) return
                  setSelectedValue("delivery_point");
                  setSelectedProviderPoint("glsShop");
                  // if (selectedProviderPoint) {
                  //   setGlsOpen(true);
                  // }
                }}
              >
                <div className={styles.radioImageDiv}>
                  <FormControlLabel
                    value="delivery_point"
                    control={<Radio color="success"
                      checked={selectedProviderPoint === "glsShop"}
                    />}
                    disabled={!glsShopPointPrice}
                    label={
                      <div className={styles.glsPointLabelWrap}>
                        <img src={gls} alt="GLS" />
                        <p>Shop</p>
                      </div>
                    }
                  />
                </div>
                <p className={styles.price}>{glsShopPointPrice ? `${glsShopPointPrice?.priceWithVat} €` : "Delivery not available"}</p>
              </div>

              {/* DPD */}

              <div
                className={styles.selectBlock}
                onClick={() => {
                  if (!["cz", "de", "pl", "sk", "hr"].includes(country?.toLowerCase())) return
                  setSelectedValue("delivery_point");
                  setSelectedProviderPoint("dpd");
                  setDpdOpen(true)
                  setOpenPoint(false);
                }}
              >
                <div className={styles.radioImageDiv}>
                  <FormControlLabel
                    value="delivery_point"
                    control={<Radio color="success"
                      disabled={
                        !["cz", "de", "pl", "sk", "hr"].includes(country?.toLowerCase()) ||
                        !dpdPointPrice
                      }
                      checked={selectedProviderPoint === "dpd"}
                    />}
                    label={<img src={dpd} alt="Packeta" />}
                  />
                </div>
                <p className={styles.price}>
                  {dpdPointPrice ? `${dpdPointPrice?.priceWithVat} €` : "Delivery not available"}
                </p>
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
                      {selectedProviderCourier === "dpd" && <img src={dpd} alt="DPD" />}
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
                  // setPaketaOpen(!paketaOpen);
                  setOpenDH(false)
                }}
              >
                <div className={styles.radioImageDiv}>
                  <FormControlLabel
                    value="courier"
                    control={<Radio color="success"
                      disabled={!paketaDHPrice}
                      checked={selectedProviderCourier === "packeta"}
                    />}
                    label={<img src={paketa} alt="Packeta" />}
                  />
                </div>
                <p className={styles.price}>{paketaDHPrice ? `${paketaDHPrice?.priceWithVat} €` : "Delivery not available"} </p>
              </div>

              {/* GLS */}
              <div
                className={styles.selectBlock}
                onClick={() => {
                  if (!glsDHPrice) return
                  setSelectedValue("courier");
                  setSelectedProviderCourier("gls");
                  // setGlsOpen(true);
                  // if (window.findGlsPs) window.findGlsPs();
                  setOpenPoint(false);
                }}
              >
                <div className={styles.radioImageDiv}>
                  <FormControlLabel
                    value="courier"
                    disabled={!glsDHPrice}
                    control={<Radio color="success"
                      checked={selectedProviderCourier === "gls"}
                    />}
                    label={<img src={gls} alt="GLS" />}
                  />
                </div>
                <p className={styles.price}>{glsDHPrice ? `${glsDHPrice?.priceWithVat} €` : "Delivery not available"} </p>
              </div>

              {/* dpd */}
              <div
                className={styles.selectBlock}
                onClick={() => {
                  if (!["cz", "de", "pl", "sk", "hr"].includes(country?.toLowerCase())) return
                  setSelectedValue("courier");
                  setSelectedProviderCourier("dpd");
                  // setPaketaOpen(!paketaOpen);
                  setOpenDH(false)
                }}
              >
                <div className={styles.radioImageDiv}>
                  <FormControlLabel
                    value="courier"
                    control={<Radio color="success"
                      disabled={
                        !["cz", "de", "pl", "sk", "hr"].includes(country?.toLowerCase()) ||
                        !dpdDHPrice
                      }
                      checked={selectedProviderCourier === "dpd"}
                    />}
                    label={<img src={dpd} alt="Packeta" />}
                  />
                </div>
                <p className={styles.price}>
                  {dpdDHPrice ? `${dpdDHPrice?.priceWithVat} €` : "Delivery not available"}
                </p>
              </div>
            </div>
          </RadioGroup>
        </FormControl>

        <DpdPickupWidget
          sellerId={sellerId}
          open={dpdOpen}
          setOpen={setDpdOpen}
          setIsNotChoose={setIsNotChoosePoint}
        />

        <GlsWidget
          sellerId={sellerId}
          open={glsOpen}
          setOpen={setGlsOpen}
          setIsNotChoose={setIsNotChoosePoint}
          selectedProviderPoint={selectedProviderPoint}

        />
        {/* <TestGls /> */}
        <PacketaWidget setIsNotChoose={setIsNotChoosePoint} sellerId={sellerId} open={paketaOpen} setOpen={setPaketaOpen} />
      </div>
    );
  }

};

export default PaymentDeliverySelect;
