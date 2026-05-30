import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/seller/onboarding/FormField';
import { onboardingSelectTriggerClassName } from '@/components/seller/onboarding/onboardingControlStyles';

export function SellerCountrySelectView({
  id,
  label,
  placeholder,
  value,
  options = [],
  onChange,
  error,
  required = false,
}) {
  return (
    <FormField id={id} label={label} error={error} required={required}>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id={id} className={onboardingSelectTriggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
