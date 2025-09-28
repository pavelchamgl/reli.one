import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import styles from "./SellerHomeGraphe.module.scss"
import { useMediaQuery } from "react-responsive";

// Пример данных
// const data = [
//   { date: "17.11", day: "MU", orders: 3, delivered: 5 },
//   { date: "18.11", day: "Tue", orders: 12, delivered: 7 },
//   { date: "19.11", day: "Wed", orders: 6, delivered: 8 },
//   { date: "20.11", day: "Thu", orders: 8, delivered: 10 },
//   { date: "21.11", day: "Fri", orders: 5, delivered: 9 },
//   { date: "22.11", day: "Sat", orders: 12, delivered: 6 },
//   { date: "23.11", day: "Sun", orders: 7, delivered: 4 },
//   { date: "17.11", day: "MU", orders: 3, delivered: 5 },
//   { date: "18.11", day: "Tue", orders: 12, delivered: 7 },
//   { date: "19.11", day: "Wed", orders: 6, delivered: 8 },
//   { date: "19.11", day: "Wed", orders: 6, delivered: 8 },
//   { date: "19.11", day: "Wed", orders: 6, delivered: 8 },
//   { date: "17.11", day: "MU", orders: 3, delivered: 5 },
//   { date: "18.11", day: "Tue", orders: 12, delivered: 7 },
//   { date: "19.11", day: "Wed", orders: 6, delivered: 8 },
//   { date: "19.11", day: "Wed", orders: 6, delivered: 8 },
// ];

// Кастомный Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "#212121",
          color: "#fff",
          padding: "10px",
          borderRadius: "8px",
          fontSize: "14px",
        }}
      >
        <p>{`Date: ${label}`}</p>
        <p>
          <span style={{ color: payload[0].fill, fontWeight: "bold" }}>
            Orders:
          </span>{" "}
          {payload[0].value} pcs.
        </p>
        <p>
          <span style={{ color: payload[1].fill, fontWeight: "bold" }}>
            Delivered:
          </span>{" "}
          {payload[1].value} pcs.
        </p>
      </div>
    );
  }
  return null;
};

const CustomXAxisTick = ({ x, y, payload }) => {
  const [date, day] = payload.value.split(" ");
  return (
    <g style={{ paddingTop: "10px" }} transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={-5} textAnchor="middle" fill="#666" fontSize={12}>
        {date}
      </text>
      <text x={0} y={15} textAnchor="middle" fill="#999" fontSize={10}>
        {day}
      </text>
    </g>
  );
};

const SellerHomeGraphe = ({ data, tabMain, setGrapheData }) => {
  const isMobile = useMediaQuery({ maxWidth: 427 });

  const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const transformedData = data?.map(item => {
    const dateObj = new Date(item.date);
    return {
      date: dateObj.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }).replace("/", "."),
      day: daysMap[dateObj.getDay()],
      orders: tabMain === "curr" ? Number(item.ordered_amount) : item.ordered_count,
      delivered: tabMain === "curr" ? Number(item.delivered_amount) : item.delivered_count,
      ordered_amount: Number(item.ordered_amount) || 0,
      ordered_count: item.ordered_count || 0,
      delivered_amount: Number(item.delivered_amount) || 0,
      delivered_count: item.delivered_count || 0,
      today:item.date
    };
  });

  

  // Функция для обработки клика
  const handleBarClick = (_, data) => {
    if (!data) return;

    const selectedData = {
      day: data.day,
      today: data.today,
      ordered_period: {
        amount: data.ordered_amount.toString(), // Преобразуем в строку
        count: data.ordered_count,
      },
      delivered_period: {
        amount: data.delivered_amount.toString(), // Преобразуем в строку
        count: data.delivered_count,
      },
    };

    setGrapheData(selectedData);
  };

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width={isMobile ? 600 : 837} height="100%">
        <BarChart
          data={transformedData}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          barCategoryGap="10%"
          onClick={(e) => e.activePayload && handleBarClick(e.activePayload[0], e.activePayload[0]?.payload)}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={(entry) => `${entry.date} ${entry.day}`}
            tick={<CustomXAxisTick />}
            tickMargin={15}
            interval="preserveStartEnd"
          />
          <YAxis tickFormatter={(value) => (tabMain === "curr" ? `€ ${value}` : `${value} pcs`)} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="orders" fill="#64748B" name="Orders" barSize={10} />
          <Bar dataKey="delivered" fill="#97E3D5" name="Delivered" barSize={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


export default SellerHomeGraphe;
