import styles from "./OrdersGraphe.module.scss";

const OrdersGraphe = ({ dataMain }) => {
  const data = [
    { name: "Awaiting assembly and shipment", value: dataMain?.awaiting_assembly_and_shipment ?? 0 },
    { name: "Deliverable", value: dataMain?.deliverable ?? 0 },
    { name: "Delivered", value: dataMain?.delivered ?? 0 },
    { name: "Canceled", value: dataMain?.canceled ?? 0 },
    { name: "All", value: dataMain?.all ?? 0 },
  ];

  // Определение максимального значения
  const max = Math.max(...data.map((item) => item.value));

  // Добавление процентов
  const newData = data.map((item) => ({
    ...item,
    percent: max ? (item.value * 100) / max : 0, // Вычисление процентов, если max > 0
  }));

  // Проверка, все ли значения равны 0
  const allValuesAreZero = data.every((item) => item.value === 0);

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
                {item.name.includes("Aw") && (
                  <div
                    className="colorDiv"
                    style={{
                      height: "100%",
                      width: `${item.percent}%`,
                      background: "#f8d568",
                    }}
                  ></div>
                )}
                {item.name.includes("Deliverable") && (
                  <div
                    className="colorDiv"
                    style={{
                      height: "100%",
                      width: `${item.percent}%`,
                      background: "#4da7f0",
                    }}
                  ></div>
                )}
                {item.name.includes("Delivered") && (
                  <div
                    className="colorDiv"
                    style={{
                      height: "100%",
                      width: `${item.percent}%`,
                      background: "#97e3d5",
                    }}
                  ></div>
                )}
                {item.name.includes("Can") && (
                  <div
                    className="colorDiv"
                    style={{
                      height: "100%",
                      width: `${item.percent}%`,
                      background: "#f05b5b",
                    }}
                  ></div>
                )}
                {item.name.includes("All") && (
                  <div
                    className={styles.chartBar}
                    style={{
                      width: `100%`,
                      backgroundColor: allValuesAreZero ? "#ced4d7" : "transparent", // Серый, если все значения 0
                      background: allValuesAreZero
                        ? "" // Убираем градиент, если все значения 0
                        : `linear-gradient(to right, 
                            #f8d568 ${newData[0].percent}%, 
                            #4da7f0 ${newData[0].percent}% ${newData[0].percent + newData[1].percent}%, 
                            #97e3d5 ${newData[0].percent + newData[1].percent}% ${newData[0].percent + newData[1].percent + newData[2].percent}%, 
                            #f05b5b ${newData[0].percent + newData[1].percent + newData[2].percent}%)`,
                    }}
                  ></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default OrdersGraphe;
