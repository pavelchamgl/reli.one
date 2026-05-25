import { Drawer } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { addToBasket, plusCount } from "../../../redux/basketSlice";
import { isItemAvailable } from "../../../utils/stockAvailability";
import styles from "./MobVariantDrawer.module.scss";

const MobVariantDrawer = ({
  open,
  handleClose,
  allData,
  variants,
  setMobSelected,
}) => {
  const [sku, setSku] = useState(null);
  const [selected, setSelected] = useState(null);
  const [varPack, setVarPack] = useState(null);

  const firstVariant = variants && variants.length > 0 ? variants[0] : {};
  const { image, name, text, price } = firstVariant;

  const dispatch = useDispatch();
  const basket = useSelector((state) => state.basket.basket);
  const { t } = useTranslation();

  useEffect(() => {
    const variant = variants?.find((item) => item.sku === selected);
    const basketVariant = basket.find((item) => item.sku === selected);

    if (selected && variant && isItemAvailable(variant)) {
      if (basketVariant) {
        dispatch(
          plusCount({
            sku: variant.sku,
            count: Number(basketVariant.count) + 1,
          })
        );
        handleClose()
      } else {
        dispatch(
          addToBasket({
            id: allData.id,
            product: { ...allData, price: variant?.price },
            count: 1,
            selected: false,
            sku: selected,
            seller_id: allData.seller_id,
            price_without_vat: variant.price_without_vat
          })
        );
        handleClose()
      }
    }
  }, [selected]);

  useEffect(() => {
    if (text && price) {
      setVarPack("pack3");
    } else if (image && price) {
      setVarPack("pack2");
    } else if (variants?.length > 0 && price) {
      setVarPack("generic");
    } else {
      setVarPack(null);
    }
  }, [variants, image, text, price]);

  const renderVariantButton = (item, content, className = "") => {
    const available = isItemAvailable(item);

    return (
      <button
        type="button"
        className={className}
        style={{
          borderColor: selected === item.sku ? "black" : "#64748b",
          opacity: available ? 1 : 0.55,
        }}
        aria-disabled={!available}
        onClick={() => {
          if (!available) {
            return;
          }
          setSelected(item.sku);
        }}
        key={item?.sku}
      >
        {content}
        {!available && <span>{t("out_of_stock")}</span>}
      </button>
    );
  };

  const renderGenericVariantContent = (item) => (
    <>
      <p>{item.name || item.sku}</p>
      <span>{item.price}€</span>
    </>
  );

  return (
    <div>
      <Drawer
        sx={{
          zIndex: 1300,
        }}
        open={open}
        anchor="bottom"
        onClose={handleClose}
      >
        <div className={styles.main}>
          {variants && variants.length === 0 ? (
            <></>
          ) : (
            <div className={styles.mainCharack}>
              <p className={styles.styleText}>Select {name}</p>
              {varPack && varPack === "pack2" && (
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
              )}
              {varPack && varPack === "pack3" && (
                <div className={styles.stylePackVThreeButtons}>
                  {variants && variants.length > 0
                    ? variants.map((item) =>
                        renderVariantButton(
                          item,
                          <>
                            <p>{item?.text}</p>
                            <span>{item?.price}€</span>
                          </>
                        )
                      )
                    : null}
                </div>
              )}
              {varPack === "generic" && (
                <div className={styles.stylePackVThreeButtons}>
                  {variants.map((item) =>
                    renderVariantButton(item, renderGenericVariantContent(item))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
};

export default MobVariantDrawer;
