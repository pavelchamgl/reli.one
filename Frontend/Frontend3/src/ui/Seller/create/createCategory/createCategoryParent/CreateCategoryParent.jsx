import { useSelector } from "react-redux";
import testIcon from "../../../../../assets/Header/LikeIcon.svg"
import { useActions } from "../../../../../hook/useAction";

import styles from './CreateCategoryParent.module.scss';

const CategoryBtn = ({ item, stage, setStage, setOpen }) => {
    const { setChildCategories, setChildCategoryName, setCategoriesStage } = useActions();
    const { categoriesStatus, childCategoryName } = useSelector((state) => state.create);


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

    return (
        <button onClick={handleClick} className={styles.categoryBtn}>
            {stage === 1 && <img src={item?.image_url} alt={item?.name || "Category"} />}
            <p>
                {categoriesStatus === "child" && !item.children && childCategoryName
                    ? `${childCategoryName ? `${childCategoryName} - ` : ""}${item?.name}`
                    : item?.name}
            </p>
        </button>
    );
};

const CreateCategoryParent = ({ item, stage, setStage, setOpen }) => {
    return <CategoryBtn item={item} stage={stage} setStage={setStage} setOpen={setOpen} />;
};

export default CreateCategoryParent;
