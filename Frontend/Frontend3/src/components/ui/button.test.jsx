import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button (shadcn/ui)', () => {
  it('renders with default variant', () => {
    render(<Button type="button">Continue</Button>);
    const button = screen.getByRole('button', { name: 'Continue' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });

  it('supports destructive variant', () => {
    render(
      <Button type="button" variant="destructive">
        Delete
      </Button>
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'bg-destructive'
    );
  });
});
