import { useEffect, useState } from "react";
import styles from "./SellerHomeTitle.module.scss";

const SellerTitle = ({title}) => {
  const [day, setDay] = useState(null);
  const [month, setMonth] = useState(null);

  const months = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
  };

  const getDateFunc = () => {
    const day = new Date().getDate();
    const month = new Date().getMonth();

    let suffix;
    if (day === 1 || day === 21 || day === 31) {
      suffix = "st";
    } else if (day === 2 || day === 22) {
      suffix = "nd";
    } else if (day === 3 || day === 23) {
      suffix = "rd";
    } else {
      suffix = "th";
    }

    const formattedDay = `${day}${suffix}`;

    setDay(formattedDay);
    setMonth(months[month + 1]);
  };

  useEffect(() => {
    getDateFunc();
  }, []);

  return (
    <div className={styles.main}>
      <h3>{title}</h3>
      <span>
        Today is {month && month} {day && day}
      </span>
    </div>
  );
};

export default SellerTitle;
