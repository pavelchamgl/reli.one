import { useTranslation } from 'react-i18next';

import styles from './CategoryAndRateTable.module.scss';

const CategoryAndRateTable = () => {

    const { t } = useTranslation("pricing")


    const categoryArr = [
        { title: t("arts"), rate: "8%" },
        { title: t("beauty"), rate: "6.5%" },
        { title: t("car_parts"), rate: "5.5%" },
        { title: t("children"), rate: "7%" },
        { title: t("clothes"), rate: "6.5%" },
        { title: t("construction"), rate: "7%" },
        { title: t("electronics"), rate: "3%" },
        { title: t("equipment"), rate: "5%" },
        { title: t("food"), rate: "4%" },
        { title: t("furniture"), rate: "6%" },
        { title: t("hiking"), rate: "5.5%" },
        { title: t("hobbies"), rate: "6%" },
        { title: t("house"), rate: "6%" },
        { title: t("jewelry"), rate: "6.5%" },
        { title: t("luggage"), rate: "6%" },
        { title: t("medical"), rate: "5%" },
        { title: t("office"), rate: "6%" },
        { title: t("pets"), rate: "6%" },
        { title: t("photovoltaics"), rate: "3%" },
        { title: t("sport"), rate: "5.5%" },
        { title: t("toys"), rate: "6.5%" },
        { title: t("watches"), rate: "7%" }
    ];


    return (
        <div className={styles.main}>
            <div className={styles.categoryTitleWrap}>
                <p>Category</p>
                <p>Rate</p>
            </div>
            {
                categoryArr.map((item) => (
                    <div className={styles.categoryItem}>
                        <p>{item.title}</p>
                        <span>{item.rate}</span>
                    </div>
                ))
            }
        </div>
    )
}

export default CategoryAndRateTable