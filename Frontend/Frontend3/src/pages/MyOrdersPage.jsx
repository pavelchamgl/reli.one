import Container from "../ui/Container/Container";
import NoContentText from "../ui/NoContentText/NoContentText";

import styles from "../styles/MyOrdersPage.module.scss";
import { useState } from "react";
import ActualSection from "../Components/Orders/ActualSeaction/ActualSection";
import HistorySection from "../Components/Orders/HistorySection/HistorySection";

const MyOrdersPage = () => {
  const [section, setSection] = useState("Aktuální");

  return (
    <>
      <div className={styles.titleDiv}>
        <p className={styles.title}>Moje objednávky</p>
        <div className={styles.buttonDiv}>
          <button
            onClick={() => setSection("Aktuální")}
            className={
              section === "Aktuální" ? styles.buttonAcc : styles.button
            }
          >
            Aktuální{" "}
          </button>
          <button
            onClick={() => setSection("Historie")}
            className={
              section === "Historie" ? styles.buttonAcc : styles.button
            }
          >
            Historie
          </button>
        </div>
      </div>

      <Container>
        {section === "Aktuální" ? <ActualSection /> : <HistorySection />}
        <div className={styles.filterDiv}>{/* <FilterByPopularity /> */}</div>
        <div className={styles.likedProdWrap}>
          {/* <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard /> */}
          {/* <NoContentText /> */}
        </div>
      </Container>
    </>
  );
};

export default MyOrdersPage;
