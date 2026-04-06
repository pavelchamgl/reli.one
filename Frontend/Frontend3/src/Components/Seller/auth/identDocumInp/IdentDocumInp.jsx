import React, { useState } from 'react'
import CheckBox from '../../../../ui/CheckBox/CheckBox'
import styles from './IdentDocumInp.module.scss';
import UploadInp from '../sellerInfo/uploadInp/UploadInp';
import { useTranslation } from 'react-i18next';

const IdentDocumInp = () => {

    const style = {
        borderRadius: '6px',
        borderColor: '#D1D5DC'
    }

    // types = pass/driv/nati

    const [type, setType] = useState('pass')

    const { t } = useTranslation('onbording')


    return (
        <div>
            <p className={styles.title}>Identity document</p>
            <p className={styles.subTitle}>Selecting a document</p>

            <div className={styles.btnsWrap}>
                <button
                    className={type === 'pass' ? styles.activeBtn : styles.btn}
                    onClick={() => {
                        setType('pass')
                    }}
                >
                    Passport
                    <CheckBox check={type === 'pass'} style={style} />
                </button>
                <button
                    className={type === 'driv' ? styles.activeBtn : styles.btn}
                    onClick={() => {
                        setType('driv')
                    }}
                >
                    Driver's license
                    <CheckBox check={type === 'driv'} style={style} />
                </button>
                <button
                    className={type === 'nati' ? styles.activeBtn : styles.btn}
                    onClick={() => {
                        setType('nati')
                    }}
                >
                    National ID
                    <CheckBox check={type === 'nati'} style={style} />
                </button>
            </div>

            <div className={styles.documInpWrap}>
                {
                    type === 'pass' ?
                        <UploadInp
                            // title={t('onboard.seller_info.identity_doc')}
                            // description={t('onboard.seller_info.passport_id')}
                            scope={"self_employed_personal"}
                            docType={"identity_document"}
                            side={"front"}
                            // onChange={handleSingleFrontUpload}
                            inpText={'Uploud document'}
                            // stateName={selfData?.front}
                            nameTitle={"front"}
                        // onMouseDown={() => (ignoreBlurRef.current = true)}
                        />
                        :
                        <>
                            <UploadInp
                                // title={t('onboard.seller_info.identity_doc')}
                                // description={t('onboard.seller_info.passport_id')}
                                scope={"self_employed_personal"}
                                docType={"identity_document"}
                                side={"front"}
                                // onChange={handleSingleFrontUpload}
                                inpText={t('onboard.seller_info.upload_front')}
                                // stateName={selfData?.front}
                                nameTitle={"front"}
                            // onMouseDown={() => (ignoreBlurRef.current = true)}
                            />

                            <UploadInp
                                scope={"self_employed_personal"}
                                docType={"identity_document"}
                                side={"back"}
                                // onChange={handleSingleFrontUpload}
                                inpText={t('onboard.seller_info.upload_back')}
                                // stateName={selfData?.back}
                                nameTitle={"back"}
                            // onMouseDown={() => (ignoreBlurRef.current = true)}
                            />
                        </>
                }

            </div>
        </div>
    )
}

export default IdentDocumInp