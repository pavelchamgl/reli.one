import { Rating } from "@mui/material";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import { addToBasket } from "../../../redux/basketSlice";
import ProductDeliveryCar from "../../../assets/Product/productDeliveryCar.svg";
import addBasketCheckIcon from "../../../assets/Product/addBasketCheckIcon.svg";

import styles from "./ProductNameRate.module.scss";
import { useEffect, useState } from "react";
import ProdCharackButtons from "../ProdCharakButtons/ProdCharackButtons";
import BasketModal from "../../Basket/BasketModal/BasketModal";
import { useMediaQuery } from "react-responsive";

const ProductNameRate = () => {
  const [inBasket, setInBasket] = useState(false);
  const [price, setPrice] = useState("10");
  const [endPrice, setEndPice] = useState(null);
  const [sku, setSku] = useState(null);
  const [openModal, setOpenModal] = useState(false)
  const [priceVat, setPriceVat] = useState(null)
  const [categoryId, setCategoryId] = useState(null)

  const isMobile = useMediaQuery({ maxWidth: 426 })

  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();
  const { search } = useLocation()
  const dispatch = useDispatch();

  const { t } = useTranslation();

  const { id } = useParams();

  const product = useSelector((state) => state.products.product);

  const basket = useSelector((state) => state.basket.basket);

  const handleAddBasket = () => {
    if (!product || !sku || !endPrice) return;
    const firstVariant = product.variants[0];


    if (product?.variants?.length > 1) {
      if (!isMobile) {
        setOpenModal(true);
      }
    } else {
      dispatch(
        addToBasket({
          id: product.id,
          product: { ...product, price: endPrice },
          count: 1,
          selected: false,
          sku: sku,
          seller_id: product.seller_id,
          price_without_vat: firstVariant.price_without_vat
        })
      );
    }
  };

  useEffect(() => {
    if (basket.some((item) => item.sku === sku)) {
      setInBasket(true);
    } else {
      setInBasket(false);
    }
  }, [id, basket, sku]);

  const [formattedText, setFormattedText] = useState(product?.name || "");

  useEffect(() => {
    if (!product || !product.name) return;

    const replacedText = product.name.split(/(\d+)/).map((part, index) =>
      /\d+/.test(part) ? <span key={index} >{part}</span> : part
    );

    setFormattedText(replacedText);
  }, [product?.name]);

  // useEffect(() => {
  //   if (product && product.variants && product.variants.length > 0) {
  //     // Проверка, есть ли продукт с текущим id в корзине
  //     const existingProduct = basket.find((item) => item.id === product.id);


  //     if (!existingProduct) {
  //       // Если продукта нет в корзине, установить значения первого варианта
  //       const firstVariant = product.variants[0];
  //       setPrice(firstVariant.price);
  //       setEndPice(firstVariant.price);
  //       setSku(firstVariant.sku);
  //       // setPriceVat(firstVariant.price_without_vat)
  //     } else {
  //       // Если продукт уже в корзине, использовать данные из корзины
  //       setEndPice(existingProduct.product.price);
  //       setSku(existingProduct.sku);
  //       // setPriceVat(existingProduct?.price_without_vat)
  //     }
  //   }
  // }, [product, basket]);

  useEffect(() => {

    const sku = new URLSearchParams(search).get("variant")
    const firstVariant = product.variants?.[0];

    if (sku) {
      const searchVariant = product.variants?.find((item) => item.sku === sku)

      if (searchVariant) {
        setPrice(searchVariant?.price)
        setEndPice(searchVariant?.price)
        setPriceVat(searchVariant?.price_without_vat)
        setSku(sku)
      } else {
        setPrice(firstVariant?.price)
        setEndPice(firstVariant?.price)
        setPriceVat(firstVariant?.price_without_vat)
        setSku(firstVariant?.sku)
      }
    } else {
      setPrice(firstVariant?.price)
      setEndPice(firstVariant?.price)
      setPriceVat(firstVariant?.price_without_vat)
      setSku(firstVariant?.sku)
    }
  }, [])


  const setVariant = (newVariant) => {
    const params = new URLSearchParams(searchParams);
    params.set("variant", String(newVariant));

    setSearchParams(params, { replace: true }); // ✅ без reload
  };

  useEffect(() => {
    if (!sku) return
    setVariant(sku)
  }, [sku])

  // ? получения путей, для перевода id

  const paths = JSON.parse(localStorage.getItem("paths")) || {}


  useEffect(() => {
    if (paths.length > 0 && paths[0] && Object.keys(paths[0]).length > 0) {
      setCategoryId(paths[0].categoryID);
    }
  }, [paths]);


  return (
    <div className={styles.main}>
      <div className={styles.ratingDiv}>
        <Rating name="read-only" value={product.rating} readOnly />
        <p>{product.total_reviews}</p>
      </div>
      <div className={styles.nameCategoryDiv}>
        <p className={styles.name}>{formattedText}</p>
        <span className={styles.categoryName}>{t(`categories.${categoryId}`, { defaultValue: product.category_name })}</span>
      </div>
      <p className={styles.price}>{endPrice ? endPrice : price} €</p>
      <p className={styles.ndcPrice}>{t("without_vat")} <span>{priceVat} €</span></p>
      <ProdCharackButtons
        sku={sku}
        setSku={setSku}
        setPrice={setEndPice}
        setPriceVat={setPriceVat}
        variants={product?.variants}
        id={product?.id}
      />
      <button className={styles.addBasketBtn} onClick={handleAddBasket}>
        {inBasket && <img src={addBasketCheckIcon} alt="" />}
        {t("add_basket")}
      </button>
      <button className={styles.deliveryBtn}>
        <img src={ProductDeliveryCar} alt="" />
        <p>{t("delivery_btn")}</p>
      </button>
      <BasketModal handleClose={() => setOpenModal(false)} open={openModal} productData={{
        ...product,
        price: endPrice
      }} />
    </div>
  );
};

export default ProductNameRate;
