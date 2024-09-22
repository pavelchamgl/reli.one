import prodTestImg from "../../../assets/Product/ProductTestImage.svg";

import styles from "./ProdCharackButtons.module.scss";

const ProdCharackButtons = () => {
  return (
    <div className={styles.main}>
      <div>
        <p className={styles.styleText}>
          <span>Color: </span>Grey
        </p>
        <div className={styles.buttonsDiv}>
          <button>
            <img src={prodTestImg} alt="" />
          </button>
          <button>
            <img src={prodTestImg} alt="" />
          </button>
          <button>
            <img src={prodTestImg} alt="" />
          </button>
          <button>
            <img src={prodTestImg} alt="" />
          </button>
          <button>
            <img src={prodTestImg} alt="" />
          </button>
          <button>
            <img src={prodTestImg} alt="" />
          </button>
          <button>
            <img src={prodTestImg} alt="" />
          </button>
          <button>
            <img src={prodTestImg} alt="" />
          </button>
        </div>
      </div>
      <div>
        <p className={styles.styleText}>
          <span>Size: </span>Big
        </p>
        <div className={styles.sizeButtonsDiv}>
          <button>big</button>
          <button>medium</button>
          <button>large</button>
          <button>medium</button>
          <button>large</button>
          <button>big</button>
        </div>
      </div>
      <div>
        <p className={styles.styleText}>
          <span>Style: </span>3 Pack
        </p>
        <div className={styles.stylePackVOneButtons}>
          <button>
            <img src={prodTestImg} alt="" />
            <div>
              <p>$35.99</p>
              <p>($0.15/Ounce)</p>
            </div>
          </button>
          <button>
            <img src={prodTestImg} alt="" />
            <div>
              <p>$35.99</p>
              <p>($0.15/Ounce)</p>
            </div>
          </button>
        </div>
      </div>
      <div>
        <p className={styles.styleText}>
          <span>Style: </span>3 Pack
        </p>
        <div className={styles.stylePackVTwoButtons}>
          <button>
            <img src={prodTestImg} alt="" />
            <p>$35.99</p>
          </button>
          <button>
            <img src={prodTestImg} alt="" />
            <p>$35.99</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProdCharackButtons;
