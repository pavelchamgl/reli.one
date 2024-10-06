import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";

import addBasketCheckIcon from "../../../../assets/Product/addBasketCheckIcon.svg";
import { toggleFavorite } from "../../../../api/favorite";
import mobReturnIcon from "../../../../assets/mobileIcons/mobReturnIcon.svg";
import likeIcon from "../../../../assets/Product/like.svg";
import likeAccIcon from "../../../../assets/Product/likeAcc.svg";
import prodDelivery from "../../../../assets/Product/productDeliveryCar.svg";
import MobileProdSwiper from "../../../../ui/MobileProdSlice/MobileProdSlice";

import { addToBasket } from "../../../../redux/basketSlice";

import styles from "./ProductImageAndName.module.scss";
import ProdCharackButtons from "../../ProdCharakButtons/ProdCharackButtons";

const ProductImageAndName = () => {
  const product = useSelector((state) => state.products.product);

  const [inBasket, setInBasket] = useState(false);

  const [like, setLike] = useState(product ? product.is_favorite : false);

  const [price, setPrice] = useState("10");
  const [endPrice, setEndPice] = useState("10");
  const [sku, setSku] = useState(null);

  const basket = useSelector((state) => state.basket.basket);

  const navigate = useNavigate();

  const { id } = useParams();

  const { t } = useTranslation();


  const dispatch = useDispatch();



  const handleAddBasket = () => {
    dispatch(
      addToBasket({
        id: product.id,
        product: { ...product, price: endPrice },
        count: 1,
        selected: false,
        sku: sku,
      })
    );
  };

  useEffect(() => {
    if (basket.some((item) => item.id === Number(id))) {
      setInBasket(true);
    } else {
      setInBasket(false);
    }
  }, [id, basket]);

  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      // Проверка, есть ли продукт с текущим id в корзине
      const existingProduct = basket.find((item) => item.id === product.id);

      if (!existingProduct) {
        // Если продукта нет в корзине, установить значения первого варианта
        const firstVariant = product.variants[0];
        setPrice(firstVariant.price);
        setEndPice(firstVariant.price);
        setSku(firstVariant.sku);
      } else {
        // Если продукт уже в корзине, использовать данные из корзины
        // setPrice(existingProduct.product.price);
        setEndPice(existingProduct.product.price);
        setSku(existingProduct.sku);
      }
    }
  }, [product, basket]);

  const handleLikeClick = async () => {
    const newLike = !like;
    setLike(newLike);
    try {
      await toggleFavorite(data.id);
    } catch (error) {
      // Обработка ошибки
      setLike(!newLike); // Вернуть предыдущее состояние в случае ошибки
    }
  };

  console.log(product);

  return (
    <div className={styles.main}>
      <div className={styles.buttonWrap}>
        <button onClick={() => navigate(-1)}>
          <img src={mobReturnIcon} alt="" />
        </button>
        <button onClick={handleLikeClick}>
          <img src={like ? likeAccIcon : likeIcon} alt="" />
        </button>
      </div>
      <MobileProdSwiper />
      <div className={styles.descAndBtnWrap}>
        <p className={styles.title}>{product?.name}</p>
        <ProdCharackButtons
          setPrice={setEndPice}
          setSku={setSku}
          variants={product?.variants}
          id={product?.id}
        />
        <div className={styles.priceWrap}>
          <p>{price} €</p>
          {/* <span>400.00 Kč</span> */}
        </div>
        <button className={styles.basketBtn} onClick={handleAddBasket}>
          {inBasket && <img src={addBasketCheckIcon} alt="" />}
          {t("add_basket")}
        </button>
        <button className={styles.deliveryBtn}>
          <img src={prodDelivery} alt="" />
          <p>{t("delivery_btn")}</p>
        </button>
      </div>
    </div>
  );
};

export default ProductImageAndName;
