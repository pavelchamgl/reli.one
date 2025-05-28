import { Drawer } from "@mui/material";
import { useMediaQuery } from "react-responsive";
import { useSelector } from "react-redux";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActions } from "../../../hook/useAction";
import { useTranslation } from "react-i18next";

import CatalogItem from "../CatalogItem/CatalogItem";
import CatalogCard from "../CatalogCard/CatalogCard";
import Header from "../../Header/Header";
import CatalogCardSimple from "../CatalogCardSimple/CatalogCardSimple";

import styles from "./CatalogDrawer.module.scss";

const CatalogDrawer = ({ open, handleClose }) => {
  const isPlanshet = useMediaQuery({ maxWidth: 950 });
  const isMobile = useMediaQuery({ maxWidth: 500 });
  const [catalogCategory, setCatalogCategory] = useState("");

  const navigate = useNavigate();

  const { fetchGetCategory } = useActions();

  const { t } = useTranslation();

  useEffect(() => {
    if (open) {
      fetchGetCategory();
    }
  }, [open]);

  const categories = useSelector((state) => state.category.categories);
  const categoryItem = useSelector((state) => state.category.category);
  const podCategory = useSelector((state) => state.category.podCategory);
  const category = useSelector((state) => state.category.category);

  const handleCategoryClick = (name, id) => {
    navigate(
      `/product_category/${id}?categoryValue=${encodeURIComponent(
        name
      )}&categoryID=${id}`
    )
    handleClose();
  };

  return (
    <div className={isPlanshet ? styles.mainWrap : ""}>
      <Drawer open={open} anchor="top" onClose={handleClose}>
        {isPlanshet && <Header />}
        <div className={styles.main}>
          <div className={styles.catalogItemWrapMain}>
            <div className={styles.catalogItemWrap}>
              {categories.map((item) => {
                if (item?.children) {
                  return (
                    <CatalogItem
                      key={item.id}
                      catalogCategory={catalogCategory}
                      setCatalogCategory={setCatalogCategory}
                      data={item}
                      handleClose={handleClose}
                    />
                  );
                } else {
                  return (
                    <button
                      key={item.id}
                      className={styles.catalogItemBtn}
                      onClick={() => handleCategoryClick(item?.name, item?.id)}
                    >
                      <CatalogItem
                        catalogCategory={catalogCategory}
                        setCatalogCategory={setCatalogCategory}
                        data={item}
                        handleClose={handleClose}
                      />
                    </button>
                  );
                }
              })}
            </div>
          </div>
          {!isMobile && (
            <div>
              <h4 className={styles.catalogTitle}>{category?.name}</h4>
              <div className={styles.categoryCardWrap}>
                {categoryItem?.children?.map((item, index) => {
                  if (!item?.children) {
                    return (
                      <CatalogCardSimple
                        item={item}
                        key={item.id}
                        handleClose={handleClose}
                      />
                    );
                  } else {
                    // Для первого элемента создаем обертку, в которую добавляем CatalogCard и дополнительные элементы
                    return (
                      <React.Fragment key={item.id}>
                        {index === 0 && (
                          <div className={styles.categoryCardBtnWrap}>
                            <div className={styles.categoryCardDiv}>
                              {categoryItem?.children?.map((subItem) => (
                                <CatalogCard item={subItem} key={subItem.id} />
                              ))}
                            </div>
                            <div className={styles.categoryTextDiv}>
                              {podCategory?.children?.map((child) => (
                                <p
                                  onClick={() =>
                                    handleCategoryClick(child?.name, child?.id)
                                  }
                                  className={styles.categoryText}
                                  key={child.id}
                                >
                                  {child.name}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  }
                })}
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
};

export default CatalogDrawer;
