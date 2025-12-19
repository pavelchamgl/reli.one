import { useEffect, useState } from "react";
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
import { useActionPayment } from "../hook/useActionPayment";
import { useSelector } from "react-redux";
import TelegramMeneger from "../Components/TelegramMenedgerBtn/TelegramMeneger";


const PaymentPage = () => {
  const [selectedValue, setSelectedValue] = useState("female");
  const isMobile = useMediaQuery({ maxWidth: 426 });

  const { setPageSection } = useActionPayment()

  const { pageSection } = useSelector(state => state.payment)

  const [section, setSection] = useState(pageSection);

  useEffect(() => {
    setPageSection(section)
  }, [section])



  return (
    <div>
      {section === 1 && <PaymentContentBlock section={section} setSection={setSection} />}
      {section === 2 && <PaymentDeliveryBlock section={section} setSection={setSection} />}
      {section === 3 && <PaymentPlataBlock section={section} setSection={setSection} />}

      {!isMobile && <BasketTotalBlock section={section} />}
      <TelegramMeneger />
    </div>
  );
};

export default PaymentPage;
