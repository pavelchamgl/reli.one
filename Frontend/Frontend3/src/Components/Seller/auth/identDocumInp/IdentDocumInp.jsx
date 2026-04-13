import React, { useState } from 'react'
import CheckBox from '../../../../ui/CheckBox/CheckBox'
import styles from './IdentDocumInp.module.scss';
import UploadInp from '../sellerInfo/uploadInp/UploadInp';
import { useTranslation } from 'react-i18next';
import { uploadSingleDocument } from '../../../../api/seller/onboarding';

const IdentDocumInp = ({ selfData, ref, formik, scopeProp }) => {

    const style = {
        borderRadius: '6px',
        borderColor: '#D1D5DC'
    }

    // types = pass/driv/nati
    const [type, setType] = useState('pass')

    const [uploadPass, setUploadPass] = useState('')
    const [uploadDrivFront, setUploadDrivFront] = useState('')
    const [uploadDrivBack, setUploadDrivBack] = useState('')
    const [uploadIdFront, setUploadIdFront] = useState('')
    const [uploadIdBack, setUploadIdBack] = useState('')

    const { t } = useTranslation('onbording')

    const documSubType = {
        pass: "passport",
        driv: "driving_license",
        nati: "id_card"
    }

    // В нем изменилась структура запроса (form-data) для загрузки identity_document. 
    // Теперь необходимо дополнительно передавать поле identity_document_subtype со значением 
    // типа документа: passport, id_card или driving_license.

    const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
        uploadSingleDocument({
            file, doc_type, scope, side,
            identity_document_subtype: documSubType[type]
        })
            .then(res => {

                if (type === 'pass') {
                    formik.setFieldValue("uploadPassport", res.uploaded_at)
                    setUploadPass('full')
                }


                if (type === 'driv') {
                    if (res.side === "front") {
                        formik.setFieldValue("uploadDrivFront", res.uploaded_at)
                        setUploadDrivFront('full')
                    }

                    if (res.side === "back") {
                        formik.setFieldValue("uploadDrivBack", res.uploaded_at)
                        setUploadDrivBack('full')
                    }
                }


                if (type === 'nati') {
                    if (res.side === "front") {
                        formik.setFieldValue("uploadIdFront", res.uploaded_at)
                        setUploadIdFront('full')
                    }

                    if (res.side === "back") {
                        formik.setFieldValue("uploadIdBack", res.uploaded_at)
                        setUploadIdBack('full')
                    }
                }


                if (res.side === "front") {
                    formik.setFieldValue("uploadFront", res.uploaded_at)
                }

                if (res.side === "back") {
                    formik.setFieldValue("uploadBack", res.uploaded_at)
                }

            })
            .catch(err => {
                if (type === 'pass') {
                    setUploadPass('rej')
                }
                if (type === 'driv') {
                    if (side === "front") {
                        setUploadDrivFront('rej')
                    }

                    if (side === "back") {
                        setUploadDrivBack('rej')
                    }
                }
                if (type === 'nati') {
                    if (side === "front") {
                        setUploadIdFront('rej')
                    }

                    if (side === "back") {
                        setUploadIdBack('rej')
                    }
                }
                ErrToast(err.message)
            });
    };





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
                    type === 'pass' &&
                    <UploadInp
                        // title={t('onboard.seller_info.identity_doc')}
                        // description={t('onboard.seller_info.passport_id')}
                        scope={scopeProp}
                        docType={"identity_document"}
                        side={"front"}
                        onChange={handleSingleFrontUpload}
                        inpText={'Uploud document'}
                        stateName={selfData?.passport}
                        nameTitle={"front"}
                        onMouseDown={() => (ref.current = true)}
                        uploadStatus={uploadPass}
                    />
                }
                {
                    type === 'driv' &&
                    <>
                        <UploadInp
                            // title={t('onboard.seller_info.identity_doc')}
                            // description={t('onboard.seller_info.passport_id')}
                            scope={scopeProp}
                            docType={"identity_document"}
                            side={"front"}
                            onChange={handleSingleFrontUpload}
                            inpText={t('onboard.seller_info.upload_front')}
                            stateName={selfData?.drivFront}
                            nameTitle={"front"}
                            onMouseDown={() => (ref.current = true)}
                            uploadStatus={uploadDrivFront}
                            identTwo={'ident'}
                        />

                        <UploadInp
                            scope={scopeProp}
                            docType={"identity_document"}
                            side={"back"}
                            onChange={handleSingleFrontUpload}
                            inpText={t('onboard.seller_info.upload_back')}
                            stateName={selfData?.drivBack}
                            nameTitle={"back"}
                            onMouseDown={() => (ref.current = true)}
                            uploadStatus={uploadDrivBack}
                        />
                        {(formik.touched.uploadFront || formik.touched.uploadBack) &&
                            (formik.errors.uploadFront || formik.errors.uploadBack) && (
                                <p className={styles.errorText}>
                                    {formik.errors.uploadFront || formik.errors.uploadBack}
                                </p>
                            )}
                    </>
                }
                {
                    type === 'nati' &&
                    <>
                        <UploadInp
                            // title={t('onboard.seller_info.identity_doc')}
                            // description={t('onboard.seller_info.passport_id')}
                            scope={scopeProp}
                            docType={"identity_document"}
                            side={"front"}
                            onChange={handleSingleFrontUpload}
                            inpText={t('onboard.seller_info.upload_front')}
                            stateName={selfData?.idFront}
                            nameTitle={"front"}
                            onMouseDown={() => (ref.current = true)}
                            uploadStatus={uploadIdFront}
                            identTwo={'ident'}
                        />

                        <UploadInp
                            scope={scopeProp}
                            docType={"identity_document"}
                            side={"back"}
                            onChange={handleSingleFrontUpload}
                            inpText={t('onboard.seller_info.upload_back')}
                            stateName={selfData?.idBack}
                            nameTitle={"back"}
                            onMouseDown={() => (ref.current = true)}
                            uploadStatus={uploadIdBack}
                        />
                        {(formik.touched.uploadFront || formik.touched.uploadBack) &&
                            (formik.errors.uploadFront || formik.errors.uploadBack) && (
                                <p className={styles.errorText}>
                                    {formik.errors.uploadFront || formik.errors.uploadBack}
                                </p>
                            )}
                    </>
                }




            </div>
        </div>
    )
}

export default IdentDocumInp