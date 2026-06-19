import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useActions } from "../../../../../hook/useAction";

import arrDown from "../../../../../assets/Seller/create/arrDown.svg";
import CreateCategoryParent from "../createCategoryParent/CreateCategoryParent";
import { translateCategoryName } from "../../../../../utils/sellerCatalogI18n";

import styles from "./CreateCategoryMain.module.scss";

const CreateCategoryMain = ({ readOnlyCategory = null, err = false, setErr }) => {
    const [stage, setStage] = useState(1);
    const [open, setOpen] = useState(false);
    const [isTouched, setIsTouched] = useState(false)

    const { fetchCategories, setClearAll } = useActions();
    const { categories, categoriesStage } = useSelector((state) => state.create);
    const { category } = useSelector((state) => state.create_prev);

    const selectRef = useRef(null);

    const { t } = useTranslation(["sellerHome", "translation"])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setOpen(false);
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

    useEffect(() => {
        if (readOnlyCategory?.name) {
            setErr(false)
            return
        }
        if (category || categoriesStage?.length > 0) {
            setErr(false)
        }
    }, [readOnlyCategory, category, categoriesStage])

    return (
        <div>
            <h3 className={styles.mainTitle}>{t('goods.info')}</h3>
            <p className={styles.selectTitle}>{t('goods.category')}</p>

            <div className={err ? styles.errWrap : ""} ref={selectRef}>
                <button onClick={() => {
                    setOpen(!open)
                    setIsTouched(true)
                }} className={styles.select}>
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
                                        {`${translateCategoryName(item?.id, item?.name, t)}${!isLast ? " - " : ""}`}
                                    </span>
                                );
                            })}
                        </p>
                    ) : readOnlyCategory?.name ? (
                        <p>{translateCategoryName(readOnlyCategory.id, readOnlyCategory.name, t)}</p>
                    ) : (
                        <p>{t('goods.placeholders.selectCategory')}</p>
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
                                    setOpen={setOpen}
                                />
                            ))}
                    </div>
                )}
            </div>
            {err ? <p className={styles.errText}>{t('goods.categoryIsRequired')}</p> : ""}
        </div>
    );
};

export default CreateCategoryMain;
