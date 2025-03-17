import { useEffect, useState } from 'react'

import prodTestImg from "../../../../assets/Product/ProductTestImage.svg";

import styles from "./PreviewCharack.module.scss"

const PreviewCharack = ({ variants }) => {
    const firstVariant = Array.isArray(variants) && variants.length > 0 ? variants[0] : {};
    const { image, name, text, price } = firstVariant;

    const [varPack, setVarPack] = useState(null);
    const [selected, setSelected] = useState(firstVariant.id || null);

    useEffect(() => {
        if (text && price) {
            setVarPack("pack3");
        } else if (image && price) {
            setVarPack("pack2");
        }
    }, [text, price, image]);

    if (varPack === "pack3") {
        return (
            <div className={styles.main}>
                <div>
                    <p className={styles.styleText}>
                        <span>Style: </span> {name}
                    </p>
                    <div className={styles.stylePackVThreeButtons}>
                        {variants && variants.length > 0
                            ? variants.map((item, index) => (
                                <button
                                    style={{
                                        borderColor: selected === item.id ? "black" : "#64748b",
                                    }}
                                    onClick={() => {
                                        setSelected(item.id);
                                        setPrice(item.price);
                                    }}
                                    key={item?.id}
                                >
                                    <p>{item.text}</p>
                                    <span>{item.price}€</span>
                                </button>
                            ))
                            : null}
                    </div>
                </div>
            </div>
        );
    } else if (varPack === "pack2") {
        return (
            <div className={styles.main}>
                <div>
                    <p className={styles.styleText}>
                        <span>Style: </span>
                        {name}
                    </p>
                    <div className={styles.stylePackVTwoButtons}>
                        {variants && variants.length > 0
                            ? variants.map((item) => (
                                <button
                                    style={{
                                        borderColor: selected === item.id ? "black" : "#64748b",
                                    }}
                                    onClick={() => {
                                        setSelected(item.id);
                                        setPrice(item.price);

                                    }}
                                    key={item?.id}
                                >
                                    <img src={item?.image} alt="" />
                                    <p>{item?.price}€</p>
                                </button>
                            ))
                            : null}
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div className={styles.main}>
                <div>
                    <p className={styles.styleText}>
                        <span>Color: </span>Grey
                    </p>
                    <div className={styles.buttonsDiv}>
                        {[...Array(8)].map((_, index) => (
                            <button key={index}>
                                <img src={prodTestImg} alt="" />
                            </button>
                        ))}
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
                <div>
                    <p className={styles.styleText}>
                        <span>Style: </span>4 Pack
                    </p>
                    <div className={styles.stylePackVThreeButtons}>
                        <button>
                            <p>var1</p>
                            <span>$35.99</span>
                        </button>
                        <button>
                            <p>var2</p>
                            <span>$35.99</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default PreviewCharack