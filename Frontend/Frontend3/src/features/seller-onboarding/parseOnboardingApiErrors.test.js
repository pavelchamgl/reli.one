import { describe, it, expect } from 'vitest';

import {
  formatOnboardingRequestError,
  parseOnboardingApiErrors,
} from './parseOnboardingApiErrors';

describe('parseOnboardingApiErrors', () => {
  it('maps completeness flags to human-readable section list', () => {
    const messages = parseOnboardingApiErrors({
      completeness: {
        personal_complete: 'true',
        bank_complete: 'false',
        return_complete: 'false',
      },
    });

    expect(messages).toEqual(['Please complete: Bank account, Return address']);
  });

  it('returns detail and message fields when present', () => {
    expect(parseOnboardingApiErrors({ detail: 'Forbidden' })).toEqual(['Forbidden']);
    expect(parseOnboardingApiErrors({ message: 'Invalid IBAN' })).toEqual(['Invalid IBAN']);
  });

  it('formats request-scoped submit errors', () => {
    const message = formatOnboardingRequestError('Bank Account', {
      completeness: { bank_complete: 'false' },
    });

    expect(message).toBe('Bank Account: Please complete: Bank account');
  });
});
