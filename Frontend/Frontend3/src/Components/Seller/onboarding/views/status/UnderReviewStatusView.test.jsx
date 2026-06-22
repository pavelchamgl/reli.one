import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UnderReviewStatusView } from './UnderReviewStatusView';

describe('UnderReviewStatusView', () => {
  it('renders status hero and contact support CTA', async () => {
    const user = userEvent.setup();
    const onContactSupport = vi.fn();

    render(
      <UnderReviewStatusView
        title="Under review"
        description="Your verification is being reviewed."
        statusBadgeLabel="Pending verification"
        timelineTitle="Verification Timeline"
        timelineSteps={[
          { id: 'submitted', label: 'Submitted', status: 'completed' },
          { id: 'review', label: 'In Review', status: 'current' },
        ]}
        nextTitle="What happens next?"
        nextDescription="We will notify you by email."
        contactSupportLabel="Contact Support"
        onContactSupport={onContactSupport}
      />
    );

    expect(screen.getByRole('heading', { name: 'Under review' })).toBeInTheDocument();
    expect(screen.getByText('Pending verification')).toBeInTheDocument();
    expect(screen.getByText('In Review')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Contact Support' }));
    expect(onContactSupport).toHaveBeenCalledOnce();
  });
});
