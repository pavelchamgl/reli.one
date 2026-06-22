import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '@/Components/ui/input';
import { FormField } from './FormField';

describe('FormField', () => {
  it('associates label with control and shows error', () => {
    render(
      <FormField id="tin" label="Tax ID" error="Invalid format" required>
        <Input id="tin" name="tin" />
      </FormField>
    );

    expect(screen.getByLabelText(/Tax ID/)).toBeInTheDocument();
    expect(screen.getByText('Invalid format')).toBeInTheDocument();
  });

  it('shows hint when there is no error', () => {
    render(
      <FormField id="iban" label="IBAN" hint="Use international format">
        <Input id="iban" name="iban" />
      </FormField>
    );

    expect(screen.getByText('Use international format')).toBeInTheDocument();
  });
});
