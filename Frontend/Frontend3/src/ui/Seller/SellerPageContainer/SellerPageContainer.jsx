import { useMediaQuery } from "react-responsive";

const SellerPageContainer = ({ children }) => {
  const isPlanshet = useMediaQuery({ maxWidth: 700 });
  const isMobile = useMediaQuery({ maxWidth: 400 });

  let style = {
    padding: "0 102px",
  };
  if (isPlanshet) {
    style = {
      padding: "0 51px",
    };
  }
  if (isMobile) {
    style = {
      padding: "0 14px",
    };
  }
  return <div style={style}>{children}</div>;
};

export default SellerPageContainer;
