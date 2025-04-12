import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useActions } from "../../../hook/useAction.js";

import {
  ppl as pplPrice,
  geis,
  dpd as dpdPrice,
  calculateBoxTest,
} from "../../../code/deliveryCode.js";
import { useSelector } from "react-redux";
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";

import arrRight from "../../../assets/Payment/arrRight.svg";
import arrBottom from "../../../assets/Payment/arrBottom.svg";
// import dhl from "../../../assets/Payment/dhl.svg";
// import zasil from "../../../assets/Payment/zasil.svg";
import ppl from "../../../assets/Payment/ppl.svg";
import dpd from "../../../assets/Payment/dpd.svg";
import globalLogistic from "../../../assets/Payment/globalLogistic.svg";

import styles from "./PaymentDeliverySelect.module.scss";

const PaymentDeliverySelect = () => {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState("sclad");
  const [weight, setWeight] = useState(0);
  const [deliImg, setDeliImg] = useState(null);
  const [pplResult, setPplResult] = useState(0);
  const [geisResult, setGeisResult] = useState(0);
  const [dpdResult, setDpdResult] = useState(0);
  const [price, setPrice] = useState(0);
  const [boxSize, setBoxSize] = useState("s");
  const [value, setValue] = useState("address");

  const { t } = useTranslation();

  const { editValue } = useActions();

  const selectedProducts = useSelector(
    (state) => state.basket.selectedProducts
  );

  const calculateWeight = useCallback(() => {
    if (selectedProducts.length > 0) {
      const totalWeight = selectedProducts.reduce((acc, item) => {
        console.log(item);

        // Найти параметр weight среди параметров продукта
        const weightParam = item?.product?.product_parameters?.find?.(
          (param) => param.name === "Weight"
        );
        // Если параметр weight найден, добавить его значение к аккумулятору
        const weight = weightParam ? parseFloat(weightParam.value) || 0 : 0;
        return acc + weight;
      }, 0);

      // Преобразовать общее значение из граммов в килограммы

      setWeight(totalWeight);

      // Собираем размеры всех товаров
      const boxSizes = selectedProducts.map((product) => {

        console.log(product);


        const heightParam = product?.product?.product_parameters?.find?.(
          (param) => param.name === "Height"
        );
        const widthParam = product?.product?.product_parameters?.find?.(
          (param) => param.name === "Width"
        );
        const lengthParam = product?.product?.product_parameters?.find?.(
          (param) => param.name === "Length"
        );

        const height = heightParam ? parseFloat(heightParam.value) || 0 : 0;
        const width = widthParam ? parseFloat(widthParam.value) || 0 : 0;
        const length = lengthParam ? parseFloat(lengthParam.value) || 0 : 0;

        return { height: height, width: width, length: length }
      });

      

      const resBoxSizeT = calculateBoxTest(boxSizes)

      setBoxSize(resBoxSizeT);
    }
  }, [selectedProducts]);

  useEffect(() => {
    console.log(boxSize);
    console.log(weight);


  }, [boxSize, weight])


  useEffect(() => {
    calculateWeight();
  }, [calculateWeight]);

  useEffect(() => {

    const weightKg = weight / 1000

    console.log(weight);
    console.log(weightKg);



    const pplFuncResult = pplPrice(boxSize[0], weightKg);
    const geisFuncResult = geis(weightKg);
    const dpdFuncResult = dpdPrice(weightKg);
    setDpdResult(dpdFuncResult);
    setGeisResult(geisFuncResult);
    setPplResult(pplFuncResult);
    console.log(pplFuncResult);
    console.log(geisFuncResult);
    console.log(dpdFuncResult);
    localStorage.setItem(
      "delivery",
      JSON.stringify([
        {
          TK: "sclad",
          price: 0,
          type: 1,
        },
        {
          TK: "ppl",
          price: pplFuncResult?.price,
          type: 2,
          courier_id: 1,
        },
        {
          TK: "dpd",
          price: dpdFuncResult,
          type: 2,
          courier_id: 3,
        },
        {
          TK: "globallogistics",
          price: geisFuncResult,
          type: 2,
          courier_id: 2,
        },
      ])
    );
  }, [weight]);

  useEffect(() => {
    if (selectedValue !== "sclad" && selectedValue !== "") {
      setOpen((prevOpen) => !prevOpen);
    }
    if (selectedValue === "sclad") {
      editValue({ TK: selectedValue, price: 0, type: 1 });
    } else {
      let courirer;
      if (selectedValue === "ppl") {
        courirer = 1;
      }
      if (selectedValue === "dpd") {
        courirer = 3;
      }
      if (selectedValue === "globalLogistics") {
        courirer = 2;
      }

      editValue({
        TK: selectedValue,
        price: price,
        type: 2,
        courier_id: courirer,
      });
    }
  }, [selectedValue]);

  const handleChange = (event) => {
    if (event.target.value === "address") {
      setSelectedValue("sclad");
    } else {
      setSelectedValue(event.target.value);
    }
  };

  return (
    <div>
      <FormControl fullWidth>
        <RadioGroup
          aria-labelledby="demo-radio-buttons-group-label"
          defaultValue="sclad"
          name="radio-buttons-group"
          value={selectedValue}
          onChange={handleChange}
        >
          <div className={styles.selectBlock}>
            <FormControlLabel
              sx={{ fontSize: "12px" }}
              value="sclad"
              control={<Radio color="success" />}
              label={t("collection_warehouse")}
            />
            <p className={styles.freeText}>{t("free")}</p>
          </div>
          <button
            onClick={() => setOpen((prevOpen) => !prevOpen)}
            className={styles.selectBlock}
          >
            <div className={styles.radioImageDiv}>
              <FormControlLabel
                sx={{ marginRight: "0px" }}
                value={value}
                control={<Radio color="success" />}
                label={deliImg ? "" : t("delivery_address")}
              />
              {deliImg && <img src={deliImg} alt="" />}
            </div>
            <img src={open ? arrBottom : arrRight} alt="" />
          </button>
          <div
            className={open ? styles.selectBlockAcc : styles.selectBlockNotAcc}
          >
            {[
              // { value: "dhl", img: dhl, price: 150 },
              // { value: "zasilkovna", img: zasil, price: 150 },
              { value: "ppl", img: ppl, price: pplResult?.price || pplResult },
              { value: "dpd", img: dpd, price: dpdResult?.price || dpdResult },
              {
                value: "globalLogistics",
                img: globalLogistic,
                price: geisResult?.price || geisResult,
              },
            ].map(({ value, img, price }) => (
              <div key={value} className={styles.selectBlock}>
                <div className={styles.radioImageDiv}>
                  <FormControlLabel
                    disabled={typeof price !== "number"}
                    onClick={() => {
                      setDeliImg(img);
                      setPrice(price);
                      setValue(value);
                    }}
                    sx={{ marginRight: "0px" }}
                    value={value}
                    control={<Radio color="success" />}
                  />
                  <img src={img} alt="" />
                </div>
                <p className={styles.price}>
                  {typeof price === "number" ? `${price} €` : price}
                </p>
              </div>
            ))}
          </div>
        </RadioGroup>
      </FormControl>
    </div>
  );
};

export default PaymentDeliverySelect;
