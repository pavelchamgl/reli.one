import { useMediaQuery } from "react-responsive";

const Container = ({ children }) => {
  const isPlanshet = useMediaQuery({ maxWidth: 700 });
  const isMobile = useMediaQuery({maxWidth:400})

  let style = {
    padding: "0 100px",
  };
  if (isPlanshet) {
    style = {
      padding: "0 50px",
    };
  }
  if(isMobile){
    style={
      padding:"0 14px"
    }
  }
  return <div style={style}>{children}</div>;
};

export default Container;
