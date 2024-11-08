import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToBasket,
  plusCount,
  deleteFromBasket,
  minusCount,
} from "../../../redux/basketSlice";
import { useMediaQuery } from "react-responsive";

import { toggleFavorite } from "../../../api/favorite";
import testImage from "../../../assets/Product/ProductTestImage.svg";
import deleteIcon from "../../../assets/Basket/deleteIcon.svg";
import likeIcon from "../../../assets/Basket/likeIcon.svg";
import likeIconAcc from "../../../assets/Basket/likeAcc.svg";
import plusIcon from "../../../assets/Basket/plusIcon.svg";
import minusIcon from "../../../assets/Basket/minusIcon.svg";

import styles from "./BasketModalCard.module.scss";
import { getProductById } from "../../../api/productsApi";

const BasketModalCard = ({ data, handleClose, setMainCount }) => {
  const [countsBySku, setCountsBySku] = useState({}); // объект для хранения количества по каждому SKU
  const [like, setLike] = useState(data ? data.is_favorite : false);
  const [sku, setSku] = useState(null);
  const [variants, setVariants] = useState([]);
  const { image, name, text, price } = variants[0] || {};
  const [varPack, setVarPack] = useState(null);
  const [selected, setSelected] = useState(null);
  const [allData, setAllData] = useState(null);
  const [varPrice, setVarPrice] = useState(0);
  const [selectVar, setSelectVar] = useState([]);
  const [variant, setVariant] = useState({});

  const dispatch = useDispatch();
  const basket = useSelector((state) => state.basket.basket);

  const handleDelete = () => {
    dispatch(deleteFromBasket({ sku: selected }));
  };

  const handleToggleLike = async () => {
    const newLike = !like;
    setLike(newLike);
    try {
      await toggleFavorite(data.id);
    } catch (error) {
      setLike(!newLike); // Вернуть предыдущее состояние в случае ошибки
    }
  };

  const handleMinus = () => {
    if (countsBySku[selected] === 1) {
      handleDelete();
      return;
    }

    setCountsBySku((prev) => {
      const newCount = (prev[selected] || 1) - 1;
      dispatch(minusCount({ sku: sku, count: newCount }));
      return {
        ...prev,
        [selected]: newCount,
      };
    });
  };

  const handlePlus = () => {
    setCountsBySku((prev) => {
      const newCount = (prev[selected] || 1) + 1;
      dispatch(plusCount({ sku: sku, count: newCount }));
      return {
        ...prev,
        [selected]: newCount,
      };
    });
  };

  useEffect(() => {
    if (data) {
      getProductById(data.id)
        .then((res) => {
          const resData = res?.data;
          if (resData?.variants) {
            setVariants(resData.variants);
            setAllData(resData);

            const variant = resData.variants.find(
              (item) => Number(item.price) === Number(data.price)
            );
            if (variant) {
              setSku(variant.sku);
              setSelected(variant.sku);
              setVariant(variant);
              dispatch(
                addToBasket({
                  id: resData.id,
                  product: { ...resData, price: variant?.price },
                  count: countsBySku[variant.sku] || 1,
                  selected: false,
                  sku: variant.sku,
                })
              );
            } else {
              console.error("Не найдено совпадений по цене");
            }
          }
        })
        .catch((err) => console.error("Ошибка загрузки продукта:", err));
    }
  }, [data, dispatch]);

  useEffect(() => {
    const variant = variants?.find((item) => item.sku === selected);
    if (selected) {
      dispatch(
        addToBasket({
          id: data.id,
          product: { ...allData, price: variant?.price },
          count: countsBySku[selected] || 1,
          selected: false,
          sku: selected,
        })
      );
    }
  }, [selected]);

  useEffect(() => {
    const variants = allData?.variants;
    if (selected && variants) {
      const variant = variants.find((item) => item.sku === selected);
      setVarPrice(variant?.price ? variant?.price : 0);
      if (variant) {
        setSelectVar(variant);
        setVariant(variant);
      }
    }
  }, [selected]);

  useEffect(() => {
    if (text && price) {
      setVarPack("pack3");
    } else if (image && price) {
      setVarPack("pack2");
    }
  }, [variants, image, text, price]);

  useEffect(() => {
    const updateBasketItem = () => {
      const ourBasketItem = basket.find((item) => item.sku === selected);

      if (ourBasketItem) {
        const count = ourBasketItem.count;
        setCountsBySku((prev) => ({ ...prev, [selected]: count }));
        setMainCount(count);
        setSku(ourBasketItem.sku);
      } else {
        setCountsBySku((prev) => ({ ...prev, [selected]: 1 }));
        setMainCount(1);
      }
    };

    updateBasketItem();
  }, [selected, basket]);

  const isMobile = useMediaQuery({ maxWidth: 700 });

  return (
    <div className={styles.wrap}>
      <div className={styles.main}>
        {isMobile ? (
          <>
            <img
              className={styles.img}
              src={data?.image || data?.images?.[0]?.image_url}
              alt=""
            />
            <div className={styles.adaptiveWrap}>
              <div
                onClick={() => navigate(`/product/${data?.id}`)}
                className={styles.mobTextDiv}
              >
                <p>{data?.name}</p>
              </div>
              <div className={styles.countDiv}>
                <button onClick={handleMinus}>
                  <img src={minusIcon} alt="" />
                </button>
                <p>{countsBySku[selected] || 1}</p>
                <button onClick={handlePlus}>
                  <img src={plusIcon} alt="" />
                </button>
              </div>
              <div className={styles.priceDiv}>
                <p>
                  {varPrice
                    ? Number(varPrice) * (countsBySku[selected] || 1)
                    : 0}{" "}
                  €
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.imageTextWrap}>
              <img className={styles.img} src={data.image} alt="" />
              <div className={styles.textDiv}>
                <h3>{data.name}</h3>
                <p>
                  {selectVar && selectVar.text
                    ? `${selectVar?.name}: ${selectVar.text}`
                    : ""}
                </p>
              </div>
            </div>
            <div className={styles.countDiv}>
              <button onClick={handleMinus}>
                <img src={minusIcon} alt="" />
              </button>
              <p>{countsBySku[selected] || 1}</p>
              <button onClick={handlePlus}>
                <img src={plusIcon} alt="" />
              </button>
            </div>
            <div className={styles.priceDiv}>
              <p>
                {varPrice ? Number(varPrice) * (countsBySku[selected] || 1) : 0}{" "}
                €
              </p>
            </div>
          </>
        )}
        <div className={styles.deleteLikeDiv}>
          <button onClick={handleToggleLike}>
            <img src={like ? likeIconAcc : likeIcon} alt="" />
          </button>
          <button onClick={handleDelete}>
            <img src={deleteIcon} alt="" />
          </button>
        </div>
      </div>
      {variants.length === 1 ? (
        <></>
      ) : (
        <div className={styles.mainCharack}>
          <p className={styles.styleText}>Select {name}</p>
          {varPack && varPack === "pack2" && (
            <div className={styles.stylePackVTwoButtons}>
              {variants && variants.length > 0
                ? variants.map((item) => (
                    <button
                      style={{
                        borderColor:
                          selected === item.sku ? "black" : "#64748b",
                      }}
                      onClick={() => {
                        setSelected(item.sku);
                      }}
                      key={item.sku}
                    >
                      <img src={item?.image} alt="" />
                      <p>{item?.price}€</p>
                    </button>
                  ))
                : null}
            </div>
          )}
          {varPack && varPack === "pack3" && (
            <div className={styles.stylePackVThreeButtons}>
              {variants && variants.length > 0
                ? variants.map((item) => (
                    <button
                      style={{
                        borderColor:
                          selected === item.sku ? "black" : "#64748b",
                      }}
                      onClick={() => {
                        setSelected(item.sku);
                      }}
                      key={item.sku}
                    >
                      <p>{item?.text}</p>
                      <span>{item?.price}€</span>
                    </button>
                  ))
                : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BasketModalCard;
