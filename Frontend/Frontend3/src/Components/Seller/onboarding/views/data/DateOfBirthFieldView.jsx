import InputMask from 'react-input-mask';
import { FormField } from '@/Components/Seller/onboarding/FormField';
import { onboardingControlClassName } from '@/Components/Seller/onboarding/onboardingControlStyles';
import { cn } from '@/lib/utils';

export function DateOfBirthFieldView({
  id = 'date_of_birth',
  label,
  value,
  error,
  onChange,
  onBlur,
  placeholder = 'dd.mm.yyyy',
}) {
  return (
    <FormField id={id} label={label} error={error} required>
      <InputMask
        mask="99.99.9999"
        maskChar=""
        alwaysShowMask={false}
        placeholder={placeholder}
        value={value || ''}
        name={id}
        onChange={onChange}
        onBlur={onBlur}
      >
        {(inputProps) => (
          <input
            {...inputProps}
            id={id}
            type="tel"
            className={cn(
              'flex w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              onboardingControlClassName,
              error && 'border-destructive',
            )}
          />
        )}
      </InputMask>
    </FormField>
  );
}
