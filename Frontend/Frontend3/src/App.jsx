import "./App.css";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deselectAllProducts } from "./redux/basketSlice";

function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const basket = useSelector((state) => state.basket.basket);

  useEffect(() => {
    const currentPath = location.pathname;

    // Если текущий путь не является "basket", "payment" или "mob_basket", снимаем выделение
    if (
      currentPath !== "/basket" &&
      currentPath !== "/payment" &&
      currentPath !== "/mob_basket"
    ) {
      console.log(basket);
      dispatch(deselectAllProducts());
    }
  }, [location]);

  return <></>;
}

export default App;
