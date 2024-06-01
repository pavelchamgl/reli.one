import { useState } from "react";

import BasketTotalBlock from "../Components/Basket/BasketTotalBlock/BasketTotalBlock";
import PaymentContentBlock from "../Components/Payment/PaymentContentBlock/PaymentContentBlock";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

import styles from "../styles/Payment.module.scss";
import PaymentDeliveryBlock from "../Components/Payment/PaymentDeliveryBlock/PaymentDeliveryBlock";
import PaymentPlataBlock from "../Components/Payment/PaymentPlataBlock/PaymentPlataBlock";

const PaymentPage = () => {
  const [selectedValue, setSelectedValue] = useState("female");

  return (
    <div>
      {/* <PaymentContentBlock /> */}
      {/* <PaymentDeliveryBlock /> */}
      <PaymentPlataBlock />

      <BasketTotalBlock />
    </div>
  );
};

export default PaymentPage;
