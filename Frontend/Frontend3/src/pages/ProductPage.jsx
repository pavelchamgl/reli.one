import { useState } from "react";
import { useMediaQuery } from "react-responsive";

import Container from "../ui/Container/Container";
import ProductImages from "../Components/Product/ProductImages/ProductImages";
import ProductNameRate from "../Components/Product/ProductNameRate/ProductNameRate";
import ProductTab from "../Components/Product/ProductTab/ProductTab";
import ProductCharak from "../Components/Product/ProductCharakteristica/ProductCharak";
import BreadCrumps from "../ui/BreadCrumps/BreadCrumps";
import ProductComments from "../Components/Product/ProductComments/ProductComments";
import ProductImageAndName from "../Components/Product/ProdMobileComp/ProdImageAndName/ProductImageAndName";

import styles from "../styles/ProductPage.module.scss";
import ProdMobileSwitch from "../Components/Product/ProdMobileComp/prodMobileSwitch/ProdMobileSwitch";

const ProductPage = () => {
  const [section, setSection] = useState("Charakteristika");

  const isMobile = useMediaQuery({ maxWidth: 470 });

  return (
    <Container>
      <div className={styles.main}>
        {isMobile ? (
          <div>
            <ProductImageAndName />
            <ProdMobileSwitch />
          </div>
        ) : (
          <>
            <BreadCrumps />
            <div className={styles.imageRateDiv}>
              <ProductImages />
              <ProductNameRate />
            </div>
            <ProductTab setTab={setSection} />
          </>
        )}
        {section === "Charakteristika" && <ProductCharak />}
        {section === "Recenze" && <ProductComments />}
      </div>
    </Container>
  );
};

export default ProductPage;
