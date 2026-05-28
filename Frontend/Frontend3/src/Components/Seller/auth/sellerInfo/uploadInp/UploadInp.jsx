import { useState } from 'react';
import { useActionSafeEmploed } from '../../../../../hook/useActionSafeEmploed';
import { useLocation } from 'react-router-dom';
import { FileUploadZone } from '@/components/seller/onboarding';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE = 10 * 1024 * 1024;

const UploadInp = ({
  title,
  description,
  docType,
  scope,
  side,
  onChange,
  inpText,
  stateName,
  nameTitle,
  onMouseDown,
  uploadStatus,
  identTwo,
}) => {
  const { pathname } = useLocation();
  const companyPathname = ['/seller/seller-company', '/seller/seller-review-company'];
  const { safeData, safeCompanyData } = useActionSafeEmploed();
  const [fileName, setFileName] = useState(stateName ?? '');

  const handleSelect = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Only PDF, JPG or PNG files are allowed');
      return;
    }
    if (file.size > MAX_SIZE) {
      alert('File size must be less than 10MB');
      return;
    }

    setFileName(file.name);

    if (companyPathname.includes(pathname)) {
      safeCompanyData({ [`${nameTitle}`]: file.name });
    } else {
      safeData({ [`${nameTitle}`]: file.name });
    }

    onChange({
      file,
      doc_type: docType,
      scope,
      side,
    });
  };

  const displayName = fileName || stateName;
  const error =
    uploadStatus === 'rej' && identTwo !== 'ident'
      ? 'Failed to upload document'
      : undefined;

  return (
    <div onMouseDown={onMouseDown}>
      <FileUploadZone
        label={title}
        description={description}
        selectLabel={inpText || 'Select file'}
        files={displayName ? [{ name: displayName }] : []}
        onSelect={handleSelect}
        error={error}
      />
    </div>
  );
};

export default UploadInp;
