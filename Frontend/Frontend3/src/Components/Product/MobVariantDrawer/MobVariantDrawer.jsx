import { Drawer } from "@mui/material";
import React, { useEffect, useState } from "react";
import { getProductById } from "../../../api/productsApi";
import { useDispatch, useSelector } from "react-redux";
import { addToBasket, plusCount } from "../../../redux/basketSlice";
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

  useEffect(() => {
    const variant = variants?.find((item) => item.sku === selected);
    const basketVariant = basket.find((item) => item.sku === selected);

    if (selected) {
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
    }
  }, [variants, image, text, price]);

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
                    ? variants.map((item) => (
                      <button
                        style={{
                          borderColor:
                            selected === item.sku ? "black" : "#64748b",
                        }}
                        onClick={() => {
                          setSelected(item.sku);
                          // setPrice(item.price);
                          // setSku(item.sku);
                          // // changeVariants({
                          // //   id: id,
                          // //   price: item.price,
                          // //   sku: item.sku,
                          // // });
                        }}
                        key={item?.sku}
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
                          // setPrice(item.price);
                          // setSku(item.sku);
                        }}
                        key={item?.sku}
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
      </Drawer>
    </div>
  );
};

export default MobVariantDrawer;
