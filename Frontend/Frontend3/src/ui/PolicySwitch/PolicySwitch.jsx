import { useState } from "react";

import styles from "./PolicySwitch.module.scss";

const PolicySwitch = ({checked, setChecked}) => {
    

    return (
        <label className={styles.switch}>
            <input
                type="checkbox"
                checked={checked}
                onChange={() => setChecked(!checked)}
            />
            <span className={styles.slider}></span>
        </label>
    );
}

export default PolicySwitch