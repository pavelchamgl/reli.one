import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useState } from "react";

import returnIcon from "../assets/mobileIcons/returnCategoryIcon.svg";
import Container from "../ui/Container/Container";
import MobCategoryCard from "../ui/MobCategoryCard/MobCategoryCard";
import MobCategoryCardBtn from "../ui/MobCategoryCardBtn/MobCategoryCardBtn";
import CatalogDrawer from "../Components/Catalog/CatalogDrawer/CatalogDrawer";

import styles from "../styles/MobCategoryPage.module.scss";

const MobCategoryPage = () => {
  const navigate = useNavigate();

  const { t } = useTranslation()



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
                        handleCategoryClick(`${child?.name}!${child?.translatedName}`, child?.id)
                      }
                      className={styles.categoryText}
                      key={child.id}
                    >
                      {t(`categories.${child.id}`, { defaultValue: child.name })}
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
      {
        Object.keys(category).length > 0
        &&
        <button
          onClick={() => {
            setCatalogOpen(true);
          }}
          className={styles.returnBtn}
        >
          <img src={returnIcon} alt="" />
          <p>{t(`categories.${category.id}`, { defaultValue: category.name })}</p>
        </button>
      }
      <div
        className={`${styles.cardItemWrap} ${isCardBtnRendered ? styles.cardItemWrap2 : ""
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
