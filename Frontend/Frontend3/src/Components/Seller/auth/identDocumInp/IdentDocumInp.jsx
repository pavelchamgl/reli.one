import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import CheckBox from '../../../../ui/CheckBox/CheckBox';
import UploadInp from '../sellerInfo/uploadInp/UploadInp';
import { uploadSingleDocument } from '../../../../api/seller/onboarding';
import { ErrToast } from '../../../../ui/Toastify';

const DOC_TYPE_BUTTON_CLASS =
  'flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-sm font-medium bg-white transition';

const IdentDocumInp = ({ selfData, blurGuardRef, formik, scopeProp }) => {
  const style = {
    borderRadius: '6px',
    borderColor: '#D1D5DC',
  };

  const [type, setType] = useState('pass');

  const [uploadPass, setUploadPass] = useState('');
  const [uploadDrivFront, setUploadDrivFront] = useState('');
  const [uploadDrivBack, setUploadDrivBack] = useState('');
  const [uploadIdFront, setUploadIdFront] = useState('');
  const [uploadIdBack, setUploadIdBack] = useState('');

  const { t } = useTranslation('onbording');

  const documSubType = {
    pass: 'passport',
    driv: 'driving_license',
    nati: 'id_card',
  };

  const handleSingleFrontUpload = ({ file, doc_type, scope, side }) => {
    uploadSingleDocument({
      file,
      doc_type,
      scope,
      side,
      identity_document_subtype: documSubType[type],
    })
      .then((res) => {
        if (type === 'pass') {
          formik.setFieldValue('uploadPassport', res.uploaded_at);
          setUploadPass('full');
        }

        if (type === 'driv') {
          if (res.side === 'front') {
            formik.setFieldValue('uploadDrivFront', res.uploaded_at);
            setUploadDrivFront('full');
          }

          if (res.side === 'back') {
            formik.setFieldValue('uploadDrivBack', res.uploaded_at);
            setUploadDrivBack('full');
          }
        }

        if (type === 'nati') {
          if (res.side === 'front') {
            formik.setFieldValue('uploadIdFront', res.uploaded_at);
            setUploadIdFront('full');
          }

          if (res.side === 'back') {
            formik.setFieldValue('uploadIdBack', res.uploaded_at);
            setUploadIdBack('full');
          }
        }

        if (res.side === 'front') {
          formik.setFieldValue('uploadFront', res.uploaded_at);
        }

        if (res.side === 'back') {
          formik.setFieldValue('uploadBack', res.uploaded_at);
        }
      })
      .catch((err) => {
        if (type === 'pass') {
          setUploadPass('rej');
        }
        if (type === 'driv') {
          if (side === 'front') {
            setUploadDrivFront('rej');
          }

          if (side === 'back') {
            setUploadDrivBack('rej');
          }
        }
        if (type === 'nati') {
          if (side === 'front') {
            setUploadIdFront('rej');
          }

          if (side === 'back') {
            setUploadIdBack('rej');
          }
        }
        ErrToast(err.message);
      });
  };

  const renderDocTypeButton = (docType, label) => (
    <button
      type="button"
      className={cn(
        DOC_TYPE_BUTTON_CLASS,
        type === docType
          ? 'border-black text-[#101828]'
          : 'border-[#d1d5dc] text-[#d1d5dc] hover:border-black hover:text-[#101828]',
      )}
      onClick={() => setType(docType)}
    >
      {label}
      <CheckBox check={type === docType} style={style} />
    </button>
  );

  return (
    <div>
      <p className="text-[13px] font-medium leading-snug text-[#364153] after:ml-0.5 after:text-red-500 after:content-['*']">
        Identity document
      </p>
      <p className="my-2 text-sm text-[#364153]">Selecting a document</p>

      <div className="flex items-center justify-between gap-4 max-sm:flex-wrap max-sm:gap-2">
        {renderDocTypeButton('pass', 'Passport')}
        {renderDocTypeButton('driv', "Driver's license")}
        {renderDocTypeButton('nati', 'National ID')}
      </div>

      <div className="mt-4">
        {type === 'pass' ? (
          <UploadInp
            scope={scopeProp}
            docType="identity_document"
            side="front"
            onChange={handleSingleFrontUpload}
            inpText="Uploud document"
            stateName={selfData?.passport}
            nameTitle="front"
            onMouseDown={() => {
              if (blurGuardRef) blurGuardRef.current = true;
            }}
            uploadStatus={uploadPass}
          />
        ) : null}

        {type === 'driv' ? (
          <>
            <UploadInp
              scope={scopeProp}
              docType="identity_document"
              side="front"
              onChange={handleSingleFrontUpload}
              inpText={t('onboard.seller_info.upload_front')}
              stateName={selfData?.drivFront}
              nameTitle="front"
              onMouseDown={() => {
                if (blurGuardRef) blurGuardRef.current = true;
              }}
              uploadStatus={uploadDrivFront}
              identTwo="ident"
            />

            <UploadInp
              scope={scopeProp}
              docType="identity_document"
              side="back"
              onChange={handleSingleFrontUpload}
              inpText={t('onboard.seller_info.upload_back')}
              stateName={selfData?.drivBack}
              nameTitle="back"
              onMouseDown={() => {
                if (blurGuardRef) blurGuardRef.current = true;
              }}
              uploadStatus={uploadDrivBack}
            />
            {(formik.touched.uploadFront || formik.touched.uploadBack) &&
              (formik.errors.uploadFront || formik.errors.uploadBack) ? (
              <p className="text-sm text-destructive">
                {formik.errors.uploadFront || formik.errors.uploadBack}
              </p>
            ) : null}
          </>
        ) : null}

        {type === 'nati' ? (
          <>
            <UploadInp
              scope={scopeProp}
              docType="identity_document"
              side="front"
              onChange={handleSingleFrontUpload}
              inpText={t('onboard.seller_info.upload_front')}
              stateName={selfData?.idFront}
              nameTitle="front"
              onMouseDown={() => {
                if (blurGuardRef) blurGuardRef.current = true;
              }}
              uploadStatus={uploadIdFront}
              identTwo="ident"
            />

            <UploadInp
              scope={scopeProp}
              docType="identity_document"
              side="back"
              onChange={handleSingleFrontUpload}
              inpText={t('onboard.seller_info.upload_back')}
              stateName={selfData?.idBack}
              nameTitle="back"
              onMouseDown={() => {
                if (blurGuardRef) blurGuardRef.current = true;
              }}
              uploadStatus={uploadIdBack}
            />
            {(formik.touched.uploadFront || formik.touched.uploadBack) &&
              (formik.errors.uploadFront || formik.errors.uploadBack) ? (
              <p className="text-sm text-destructive">
                {formik.errors.uploadFront || formik.errors.uploadBack}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default IdentDocumInp;
