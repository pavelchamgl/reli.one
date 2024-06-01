import styles from "./ForSellerTable.module.scss";

const ForSellerTable = () => {
  return (
    <div>
      <div className={styles.tableItem}>
        <div>
          <p>Appliances / gadgets</p>
        </div>
        <div>
          <p>8%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>Baby / kids goods</p>
        </div>
        <div>
          <p>10%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>Backpacks / bags</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>Beauty / health</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>Clothing</p>
        </div>
        <div>
          <p>11%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>Computers</p>
        </div>
        <div>
          <p>8%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>Electronics</p>
        </div>
        <div>
          <p>8%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>Furniture</p>
        </div>
        <div>
          <p>12%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>Home and kitchen</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableBigItem}>
        <div className={styles.forBigTableDiv}>
          <p>Jewelry</p>
        </div>
        <div className={styles.forBigTableDiv}>
          <div>
            <p>16% if the price of an item is up to</p>
            <p>250$</p>
            <p>5% if the price of an item more than</p>
            <p>250$</p>
          </div>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>Garden</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>Office products</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>Pets goods</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>Sports</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableItem}>
        <div>
          <p>Toys / games</p>
        </div>
        <div>
          <p>15%</p>
        </div>
      </div>
      <div className={styles.tableBigItem}>
        <div className={styles.forBigTableDiv}>
          <p>Watches</p>
        </div>
        <div className={styles.forBigTableDiv}>
          <div>
            <p>16% if the price of an item is up to</p>
            <p>1500$</p>
            <p>5% if the price of an item more than</p>
            <p>1500$</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForSellerTable;
