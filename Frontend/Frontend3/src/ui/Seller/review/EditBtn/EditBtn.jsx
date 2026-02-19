import { useNavigate } from "react-router-dom"

import editIc from "../../../../assets/Seller/register/editIc.svg"

import styles from "./EditBtn.module.scss"

const EditBtn = ({ setOpen }) => {

    const navigate = useNavigate()

    return (
        <button onClick={() => setOpen(true)} className={styles.editBtn}>
            <img src={editIc} alt="" />
            Edit
        </button>
    )
}

export default EditBtn