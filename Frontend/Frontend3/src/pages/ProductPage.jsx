import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useActions } from "../hook/useAction";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import Container from "../ui/Container/Container";
import ProductImages from "../Components/Product/ProductImages/ProductImages";
import ProductNameRate from "../Components/Product/ProductNameRate/ProductNameRate";
import ProductTab from "../Components/Product/ProductTab/ProductTab";
import ProductCharak from "../Components/Product/ProductCharakteristica/ProductCharak";
import BreadCrumps from "../ui/BreadCrumps/BreadCrumps";
import ProductComments from "../Components/Product/ProductComments/ProductComments";
import ProductImageAndName from "../Components/Product/ProdMobileComp/ProdImageAndName/ProductImageAndName";
import ProdMobileSwitch from "../Components/Product/ProdMobileComp/prodMobileSwitch/ProdMobileSwitch";
import Loader from "../ui/Loader/Loader";
import CustomBreadcrumbs from "../ui/CustomBreadCrumps/CustomBreadCrumps";

import styles from "../styles/ProductPage.module.scss";

const ProductPage = () => {
  const [section, setSection] = useState("Charakteristika");

  const isMobile = useMediaQuery({ maxWidth: 470 });

  const { id } = useParams();

  const { fetchGetProductById, fetchGetComments } = useActions();

  useEffect(() => {
    fetchGetProductById(id);
    fetchGetComments(id);
  }, [id]);

  const { product, status } = useSelector((state) => state.products);

  if (status !== "loading") {
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
              <CustomBreadcrumbs />
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
  } else {
    return (
      <div className={styles.loaderWrap}>
        <Loader />
      </div>
    );
  }
};

export default ProductPage;
