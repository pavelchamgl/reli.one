import uploadIc from "../../../../../assets/Seller/register/uploadIc.svg"


import styles from './UploadInp.module.scss';

const UploadInp = ({ second }) => {
    return (
        <div>
            <p className={styles.title}>Identity document</p>
            <span className={styles.desc}>Passport or National ID</span>


            <div className={styles.fileInpsWrap}>
                <label >
                    <input type="file" />

                    <div className={styles.fileInpContent}>
                        <img src={uploadIc} alt="" />
                        <p>Upload front side</p>
                        <span>(PDF, JPG, PNG - Max 10MB)</span>
                    </div>

                </label>
                {
                    second &&

                    <label >
                        <input type="file" />

                        <div className={styles.fileInpContent}>
                            <img src={uploadIc} alt="" />
                            <p>Upload front side</p>
                            <span>(PDF, JPG, PNG - Max 10MB)</span>
                        </div>

                    </label>

                }


            </div>


        </div>
    )
}

export default UploadInp