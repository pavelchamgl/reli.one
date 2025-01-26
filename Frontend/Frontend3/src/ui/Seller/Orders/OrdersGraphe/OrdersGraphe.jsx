import styles from "./OrdersGraphe.module.scss";

const OrdersGraphe = () => {
  const data = [
    { name: "Awaiting assembly and shipment", value: 0 },
    { name: "Deliverable", value: 3 },
    { name: "Delivered", value: 0 },
    { name: "Canceled", value: 1 },
    { name: "All", value: 4 },
  ];

  // Определение максимального значения
  const max = Math.max(...data.map((item) => item.value));

  // Добавление процентов
  const newData = data.map((item) => ({
    ...item,
    percent: max ? (item.value * 100) / max : 0, // Вычисление процентов, если max > 0
  }));

  return (
    <>
      <p className={styles.dateText}>The last 15 days</p>
      <div className={styles.chartContainer}>
        {newData.map((item, index) => (
          <div key={index} className={styles.chartRow}>
            {/* Название категории */}
            <div className={styles.chartLabel}>
              <p>{item.name}</p>
              <p>{item.value}</p>
            </div>

            {/* График */}
            <div className={styles.chartBarWrapper}>
              <div
                className={styles.chartBar}
                style={{
                  width: `100%`, // Используем процент для ширины
                  backgroundColor: "#ced4d7", // Цвет для нулевых и ненулевых значений
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${item.percent}%`,
                    backgroundColor: "#97e3d5",
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default OrdersGraphe;
