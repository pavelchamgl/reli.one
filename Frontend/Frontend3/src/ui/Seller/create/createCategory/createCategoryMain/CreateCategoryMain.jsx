import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useActions } from "../../../../../hook/useAction";

import arrDown from "../../../../../assets/Seller/create/arrDown.svg";

import styles from "./CreateCategoryMain.module.scss";
import CreateCategoryParent from "../createCategoryParent/CreateCategoryParent";

const CreateCategoryMain = () => {
    const [selectText, setSelectText] = useState("Select a category");
    const [stage, setStage] = useState(1);
    const [open, setOpen] = useState(false);

    const { fetchCategories, setClearAll } = useActions();
    const { categories, categoriesStage } = useSelector((state) => state.create);

    // Ref для обёртки select
    const selectRef = useRef(null);

    // Закрытие при клике вне select
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setOpen(false); // Закрыть, если клик был вне компонента
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (open) {
            fetchCategories();
        } else {
            setClearAll()
            setStage(1)
        }
    }, [open]);

    return (
        <div>
            <h3 className={styles.mainTitle}>Goods Information</h3>
            <p className={styles.selectTitle}>Category and type</p>

            <div ref={selectRef}>
                <button onClick={() => setOpen(!open)} className={styles.select}>
                    {categoriesStage && categoriesStage.length > 0 ? (
                        <p>
                            {categoriesStage.map((item, index) => {
                                const isFirst = index === 0;
                                const isLast = index === categoriesStage.length - 1;

                                return (
                                    <span key={item.id} id={`selectText${item.id}`}>
                                        {isFirst && (
                                            <img
                                                src={item?.image_url}
                                                alt={item?.name || "Category"}
                                            />
                                        )}
                                        {`${item?.name}${!isLast ? " - " : ""}`}
                                    </span>
                                );
                            })}
                        </p>
                    ) : (
                        <p>{selectText}</p>
                    )}
                    <img
                        className={open ? styles.arrowOpen : styles.arrowClose}
                        src={arrDown}
                        alt="Toggle dropdown"
                    />
                </button>

                {open && (
                    <div className={styles.categoryWrap}>
                        {categories &&
                            categories.length > 0 &&
                            categories.map((item, index) => (
                                <CreateCategoryParent
                                    stage={stage}
                                    key={index}
                                    item={item}
                                    setStage={setStage}
                                />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateCategoryMain;
