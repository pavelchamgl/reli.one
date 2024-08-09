import React from "react";
import "./Spiner.scss";

const Spinner = ({ size = "24px" }) => {
  return <div className="spinner" style={{ width: size, height: size }}></div>;
};

export default Spinner;
