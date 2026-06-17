import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import testIcon from "../../../../../assets/Header/LikeIcon.svg"
import { useActions } from "../../../../../hook/useAction";
import { translateCategoryName } from "../../../../../utils/sellerCatalogI18n";

import styles from './CreateCategoryParent.module.scss';

const CategoryBtn = ({ item, stage, setStage, setOpen }) => {
    const { setChildCategories, setChildCategoryName, setCategoriesStage } = useActions();
    const { categoriesStatus, categoriesStage } = useSelector((state) => state.create);
    const { t } = useTranslation(["sellerHome", "translation"]);


const handleClick = () => {
  setCategoriesStage({ stage, category: item });

  if (item.children && item.children.length > 0) {
    setChildCategories(item.children);

    if (stage !== 3) {
      setStage(stage + 1);
    }

    if (categoriesStatus === "child") {
      setChildCategoryName(item.name);
    }
  } else {
    setOpen(false)
   
  }
};

    const parentCategory = categoriesStage[categoriesStage.length - 1];
    const displayName = categoriesStatus === "child" && !item.children && parentCategory
        ? `${translateCategoryName(parentCategory.id, parentCategory.name, t)} - ${translateCategoryName(item.id, item.name, t)}`
        : translateCategoryName(item.id, item.name, t);

    return (
        <button onClick={handleClick} className={styles.categoryBtn}>
            {stage === 1 && <img src={item?.image_url} alt={item?.name || "Category"} />}
            <p>{displayName}</p>
        </button>
    );
};

const CreateCategoryParent = ({ item, stage, setStage, setOpen }) => {
    return <CategoryBtn item={item} stage={stage} setStage={setStage} setOpen={setOpen} />;
};

export default CreateCategoryParent;
