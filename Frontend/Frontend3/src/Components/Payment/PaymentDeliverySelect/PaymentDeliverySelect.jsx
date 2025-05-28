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
import styles from "./PaymentDeliverySelect.module.scss";
import PacketaWidget from "../PaketaWidget/PaketaWidget.jsx";
import { useSelector } from "react-redux";
import { useActionPayment } from "../../../hook/useActionPayment.js";

const PaymentDeliverySelect = ({ sellerId, group }) => {
  const [selectedValue, setSelectedValue] = useState("");
  const [openPoint, setOpenPoint] = useState(false);
  const [openDH, setOpenDH] = useState(false);
  const [paketaOpen, setPaketaOpen] = useState(false);

  const [isNotChoosePoint, setIsNotChoosePoint] = useState(false)

  const [pointPrice, setPointPrice] = useState(null)
  const [DHPrice, setDHPrice] = useState(null)

  const { deliveryCost, country, pointInfo } = useSelector(state => state.payment)
  const { setDeliveryType } = useActionPayment()

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
    console.log(event.target.value);

  };

  useEffect(() => {
    const obj = {
      deliveryType: selectedValue,
      sellerId,
      deliveryPrice: selectedValue === "courier" ? DHPrice?.price : pointPrice?.price
    }
    setDeliveryType(obj)
  }, [selectedValue])

  useEffect(() => {
    if (group?.options?.length) {
      const pudoOption = group.options.find(item => item.channel === "PUDO");
      const hdOption = group.options.find(item => item.channel === "HD");

      if (pudoOption) setPointPrice(pudoOption);
      if (hdOption) setDHPrice(hdOption);
    }
  }, [group]);

  useEffect(() => {
    if (isNotChoosePoint) {
      setSelectedValue(null)
      setIsNotChoosePoint(false)
    }

  }, [setIsNotChoosePoint])

  if (pointPrice && DHPrice) {
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
                {selectedValue === "delivery_point" ? <img src={paketa} alt="" /> : <p className={styles.labelText}>Delivery point</p>}
              </div>
              <img src={openPoint ? arrBottom : arrRight} alt="" />
            </button>

            <div className={openPoint ? styles.selectBlockAcc : styles.selectBlockNotAcc}>
              {/* Example: Packeta inside Delivery Point */}
              <div
                className={styles.selectBlock}
                onClick={() => {
                  setSelectedValue("delivery_point");
                  setPaketaOpen(!paketaOpen);
                  setOpenPoint(false)
                }}
              >
                <div className={styles.radioImageDiv}>
                  <FormControlLabel
                    value="delivery_point"
                    control={<Radio color="success" />}
                    label={<img src={paketa} alt="Packeta" />}
                  />
                </div>
                <p className={styles.price}>{pointPrice?.price} €</p>
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
                {selectedValue === "courier" ? <img src={paketa} alt="" /> : <p className={styles.labelText}>Courier delivery</p>}

              </div>
              <img src={openDH ? arrBottom : arrRight} alt="" />
            </button>

            <div className={openDH ? styles.selectBlockAcc : styles.selectBlockNotAcc}>
              <div
                className={styles.selectBlock}
                onClick={() => {
                  setSelectedValue("courier");
                  // setPaketaOpen(!paketaOpen);
                  setOpenDH(false)
                }}
              >
                <div className={styles.radioImageDiv}>
                  <FormControlLabel
                    value="courier"
                    control={<Radio color="success" />}
                    label={<img src={paketa} alt="Packeta" />}
                  />
                </div>
                <p className={styles.price}>{DHPrice.price} €</p>
              </div>
            </div>
          </RadioGroup>
        </FormControl>

        <PacketaWidget setIsNotChoose={setIsNotChoosePoint} sellerId={sellerId} open={paketaOpen} setOpen={setPaketaOpen} />
      </div>
    );
  }

};

export default PaymentDeliverySelect;
