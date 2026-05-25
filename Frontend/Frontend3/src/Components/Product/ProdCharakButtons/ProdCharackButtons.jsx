import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useActions } from "../../../hook/useAction";

import styles from "./ProdCharackButtons.module.scss";
import { useTranslation } from "react-i18next";
import { isItemAvailable } from "../../../utils/stockAvailability";

const ProdCharackButtons = ({ variants = [], setPrice, sku, setSku, id, setPriceVat }) => {
  const { image, name, text, price } = variants[0] || {};

  const basket = useSelector((state) => state.basket.basket);

  const [varPack, setVarPack] = useState(null);
  const [selected, setSelected] = useState(
    variants?.[0]?.sku
  );

  const { t } = useTranslation()

  const { changeVariants } = useActions();

  useEffect(() => {
    if (text && price) {
      setVarPack("pack3");
    } else if (image && price) {
      setVarPack("pack2");
    } else if (variants.length > 0 && price) {
      setVarPack("generic");
    } else {
      setVarPack(null);
    }
  }, [text, price, image, variants.length]);


  useEffect(() => {
    if (sku) {
      setSelected(sku)
    }
  }, [sku])

  const renderVariantButton = (item, content, buttonClassName = "") => {
    const available = isItemAvailable(item);

    return (
      <button
        type="button"
        className={`${buttonClassName} ${available ? "" : styles.unavailableVariant}`.trim()}
        style={{
          borderColor: selected === item.sku ? "black" : "#64748b",
        }}
        aria-disabled={!available}
        onClick={() => {
          if (!available) {
            return;
          }
          setSelected(item.sku);
          setPrice(item.price);
          setSku(item.sku);
          setPriceVat(item?.price_without_vat);
        }}
        key={item?.sku}
      >
        {content}
        {!available && (
          <span className={styles.unavailableLabel}>{t("out_of_stock")}</span>
        )}
      </button>
    );
  };

  const renderGenericVariantContent = (item) => (
    <>
      <p>{item.name || item.sku}</p>
      <span>{item.price}€</span>
    </>
  );

  if (varPack === "pack3") {
    return (
      <div className={styles.main}>
        <div>
          <p className={styles.styleText}>
            <span>{t("style")}: </span>
            {name}
          </p>
          <div className={styles.stylePackVThreeButtons}>
            {variants && variants.length > 0
              ? variants.map((item) =>
                  renderVariantButton(
                    item,
                    <>
                      <p>{item.text}</p>
                      <span>{item.price}€</span>
                    </>
                  )
                )
              : null}
          </div>
        </div>
      </div>
    );
  } else if (varPack === "pack2") {
    return (
      <div className={styles.main}>
        <div>
          <p className={styles.styleText}>
            <span>{t("style")}: </span>
            {name}
          </p>
          <div className={styles.stylePackVTwoButtons}>
            {variants && variants.length > 0
              ? variants.map((item) =>
                  renderVariantButton(
                    item,
                    <>
                      <img src={item?.image} alt="" />
                      <p>{item?.price}€</p>
                    </>
                  )
                )
              : null}
          </div>
        </div>
      </div>
    );
  } else if (varPack === "generic") {
    return (
      <div className={styles.main}>
        <div>
          <p className={styles.styleText}>
            <span>{t("style")}: </span>
            {name || variants[0]?.name || t("style")}
          </p>
          <div className={styles.stylePackVThreeButtons}>
            {variants.map((item) =>
              renderVariantButton(item, renderGenericVariantContent(item))
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ProdCharackButtons;
