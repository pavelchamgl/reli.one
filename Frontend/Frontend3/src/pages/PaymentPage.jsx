import { useState } from "react";
import { useMediaQuery } from "react-responsive";

import BasketTotalBlock from "../Components/Basket/BasketTotalBlock/BasketTotalBlock";
import PaymentContentBlock from "../Components/Payment/PaymentContentBlock/PaymentContentBlock";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

import PaymentDeliveryBlock from "../Components/Payment/PaymentDeliveryBlock/PaymentDeliveryBlock";
import PaymentPlataBlock from "../Components/Payment/PaymentPlataBlock/PaymentPlataBlock";
import Footer from "../Components/Footer/Footer";


const PaymentPage = () => {
  const [selectedValue, setSelectedValue] = useState("female");
  const [section, setSection] = useState(1);
  const isMobile = useMediaQuery({ maxWidth: 426 });


  return (
    <div>
      {section === 1 && <PaymentContentBlock setSection={setSection} />}
      {section === 2 && <PaymentDeliveryBlock setSection={setSection} />}
      {section === 3 && <PaymentPlataBlock setSection={setSection} />}

      {!isMobile && <BasketTotalBlock />}
    </div>
  );
};

export default PaymentPage;
