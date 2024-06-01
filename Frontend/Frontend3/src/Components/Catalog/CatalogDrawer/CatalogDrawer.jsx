import { Drawer } from "@mui/material";

import styles from "./CatalogDrawer.module.scss";
import CatalogItem from "../CatalogItem/CatalogItem";
import CatalogCard from "../CatalogCard/CatalogCard";

const CatalogDrawer = ({ open, handleClose }) => {
  return (
    <div>
      <Drawer open={open} anchor="top" onClose={handleClose}>
        <div className={styles.main}>
          <div className={styles.catalogItemWrap}>
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
            <CatalogItem />
          </div>
          <div>
            <h4 className={styles.catalogTitle}>Oblečení a boty</h4>
            <div className={styles.categoryCardWrap}>
              <CatalogCard />
              <CatalogCard />
              <CatalogCard />
            </div>
          </div>
          <div className={styles.categoryTextDiv}>
            <p className={styles.categoryText}>text</p>
            <p className={styles.categoryText}>text</p>
            <p className={styles.categoryText}>text</p>
            <p className={styles.categoryText}>text</p>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default CatalogDrawer;
