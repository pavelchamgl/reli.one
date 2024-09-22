import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import React, { useState } from "react";

import returnIcon from "../assets/mobileIcons/returnCategoryIcon.svg";
import Container from "../ui/Container/Container";
import MobCategoryCard from "../ui/MobCategoryCard/MobCategoryCard";

import styles from "../styles/MobCategoryPage.module.scss";
import MobCategoryCardBtn from "../ui/MobCategoryCardBtn/MobCategoryCardBtn";
import CatalogDrawer from "../Components/Catalog/CatalogDrawer/CatalogDrawer";

const MobCategoryPage = () => {
  const navigate = useNavigate();

  const [categoryType, setCategoryType] = useState(1);

  const categories = useSelector((state) => state.category.categories);
  const categoryItem = useSelector((state) => state.category.category);
  const podCategory = useSelector((state) => state.category.podCategory);
  const category = useSelector((state) => state.category.category);

  const handleCategoryClick = (name, id) => {
    navigate(
      `/product_category?categoryValue=${encodeURIComponent(
        name
      )}&categoryID=${id}`
    );
  };

  const [catalogOpen, setCatalogOpen] = useState(false);

  const renderMobCategoryCard = () => {
    return categoryItem?.children?.map((item, index) => {
      if (!item?.children) {
        return <MobCategoryCard item={item} key={item.id} />;
      } else {
        return (
          <React.Fragment key={item.id}>
            {index === 0 && (
              <div className={styles.cardItemBtnWrap}>
                <div className={styles.cardWrap}>
                  {categoryItem?.children?.map((subItem) => (
                    <MobCategoryCardBtn item={subItem} key={subItem.id} />
                  ))}
                </div>
                <div className={styles.btnWrap}>
                  {podCategory?.children?.map((child) => (
                    <button
                      onClick={() =>
                        handleCategoryClick(child?.name, child?.id)
                      }
                      className={styles.categoryText}
                      key={child.id}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </React.Fragment>
        );
      }
    });
  };

  const isCardBtnRendered = categoryItem?.children?.some(
    (item) => item?.children
  );

  return (
    <Container>
      <button
        onClick={() => {
          setCatalogOpen(true);
        }}
        className={styles.returnBtn}
      >
        <img src={returnIcon} alt="" />
        <p>{category?.name}</p>
      </button>
      <div
        className={`${styles.cardItemWrap} ${
          isCardBtnRendered ? styles.cardItemWrap2 : ""
        }`}
      >
        {renderMobCategoryCard()}
      </div>
      <CatalogDrawer
        open={catalogOpen}
        handleClose={() => setCatalogOpen(false)}
      />
    </Container>
  );
};

export default MobCategoryPage;
