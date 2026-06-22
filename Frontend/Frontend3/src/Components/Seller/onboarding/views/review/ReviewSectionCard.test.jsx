import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReviewSectionCard } from './ReviewSectionCard';

describe('ReviewSectionCard', () => {
  it('renders rows and calls onEdit', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(
      <ReviewSectionCard
        title="Account information"
        rows={[
          { label: 'Name', value: 'Jane Doe' },
          { label: 'Email', value: 'jane@example.com' },
        ]}
        onEdit={onEdit}
        editLabel="Edit"
      />
    );

    expect(screen.getByRole('heading', { name: 'Account information' })).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledOnce();
  });
});
