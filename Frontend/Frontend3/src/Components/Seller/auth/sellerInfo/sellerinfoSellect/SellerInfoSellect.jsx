import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SellerCountrySelectView } from '@/components/seller/onboarding/views/data';

const SellerInfoSellect = ({ arr, value, setValue, title, titleSellect, errText }) => {
  const firstRender = useRef(true);
  const { t } = useTranslation('onbording');
  const [touched, setTouched] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setHasError(!value || value.length === 0);
  }, [value]);

  const options = arr?.map((item) => ({
    value: item.value,
    label: item.key ? t(item.key) : item.text,
  }));

  const showError = touched && hasError ? errText : undefined;

  return (
    <div onBlur={() => setTouched(true)}>
      <SellerCountrySelectView
        id={`select-${title}`}
        label={title}
        placeholder={titleSellect}
        value={value}
        options={options}
        onChange={setValue}
        error={showError}
        required
      />
    </div>
  );
};

export default SellerInfoSellect;
