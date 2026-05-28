import { Input } from '@/components/ui/input';
import { FormField } from '@/components/seller/onboarding/FormField';
import { SellerCountrySelectView } from './SellerCountrySelectView';

const DEFAULT_FIELD_KEYS = {
  street: 'street',
  city: 'city',
  zip_code: 'zip_code',
  country: 'country',
};

export function AddressFieldsView({
  values,
  errors = {},
  onFieldChange,
  onFieldBlur,
  labels,
  countryOptions = [],
  countryPlaceholder,
  fieldKeys = DEFAULT_FIELD_KEYS,
  streetPlaceholder = 'Main street 123',
  cityPlaceholder = 'Prague',
  zipPlaceholder = '11000',
}) {
  const keys = { ...DEFAULT_FIELD_KEYS, ...fieldKeys };

  return (
    <div className="space-y-4">
      <FormField
        id={keys.street}
        label={labels.street}
        error={errors[keys.street]}
        required
      >
        <Input
          id={keys.street}
          name={keys.street}
          value={values[keys.street] ?? ''}
          placeholder={streetPlaceholder}
          onChange={onFieldChange}
          onBlur={onFieldBlur}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={keys.city} label={labels.city} error={errors[keys.city]} required>
          <Input
            id={keys.city}
            name={keys.city}
            value={values[keys.city] ?? ''}
            placeholder={cityPlaceholder}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
          />
        </FormField>
        <FormField id={keys.zip_code} label={labels.zip} error={errors[keys.zip_code]} required>
          <Input
            id={keys.zip_code}
            name={keys.zip_code}
            value={values[keys.zip_code] ?? ''}
            placeholder={zipPlaceholder}
            onChange={onFieldChange}
            onBlur={onFieldBlur}
          />
        </FormField>
      </div>
      <SellerCountrySelectView
        id={keys.country}
        label={labels.country}
        placeholder={countryPlaceholder}
        value={values[keys.country]}
        options={countryOptions}
        onChange={(nextValue) =>
          onFieldChange({ target: { name: keys.country, value: nextValue } })
        }
        error={errors[keys.country]}
        required
      />
    </div>
  );
}
