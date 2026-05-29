import { Input } from '@/components/ui/input';
import { FormField } from '@/components/seller/onboarding/FormField';
import { onboardingControlClassName } from '@/components/seller/onboarding/onboardingControlStyles';

export function BankAccountFieldsView({
  values,
  errors = {},
  onFieldChange,
  onFieldBlur,
  labels,
  showCzSkFields = false,
  accountHolderDisabled = true,
}) {
  return (
    <div className="space-y-4">
      <FormField id="iban" label={labels.iban} error={errors.iban} required>
        <Input
          id="iban"
          name="iban"
          className={onboardingControlClassName}
          value={values.iban ?? ''}
          onChange={onFieldChange}
          onBlur={onFieldBlur}
        />
      </FormField>
      <FormField id="swift_bic" label={labels.swift} error={errors.swift_bic} required>
        <Input
          id="swift_bic"
          name="swift_bic"
          className={onboardingControlClassName}
          value={values.swift_bic ?? ''}
          onChange={onFieldChange}
          onBlur={onFieldBlur}
        />
      </FormField>
      <FormField
        id="account_holder"
        label={labels.holder}
        error={errors.account_holder}
        hint={accountHolderDisabled ? 'Auto-filled from company name and legal form' : undefined}
        required
      >
        <Input
          id="account_holder"
          name="account_holder"
          className={onboardingControlClassName}
          value={values.account_holder ?? ''}
          onChange={onFieldChange}
          onBlur={onFieldBlur}
          disabled={accountHolderDisabled}
        />
      </FormField>
      {showCzSkFields ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="bank_code" label={labels.bankCode} error={errors.bank_code} required>
            <Input
              id="bank_code"
              name="bank_code"
              className={onboardingControlClassName}
              value={values.bank_code ?? ''}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
            />
          </FormField>
          <FormField
            id="local_account_number"
            label={labels.localAccount}
            error={errors.local_account_number}
            required
          >
            <Input
              id="local_account_number"
              name="local_account_number"
              className={onboardingControlClassName}
              value={values.local_account_number ?? ''}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
            />
          </FormField>
        </div>
      ) : null}
    </div>
  );
}
