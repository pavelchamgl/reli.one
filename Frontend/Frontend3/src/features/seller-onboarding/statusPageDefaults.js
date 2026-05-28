export const underReviewStatusDefaults = {
  title: 'Under review',
  description:
    "Your verification is being reviewed by our team. We'll notify you once it's complete.",
  statusBadgeLabel: 'Pending verification',
  timelineTitle: 'Verification Timeline',
  timelineSteps: [
    { id: 'submitted', label: 'Submitted', meta: 'Mar 18, 2026', status: 'completed' },
    { id: 'review', label: 'In Review', meta: 'Est. 24-48 hours', status: 'current' },
    { id: 'approved', label: 'Approved', status: 'pending' },
  ],
  infoSections: [
    {
      title: 'Personal Information',
      rows: [
        { label: 'Full Name', value: 'Alexandra Thompson' },
        { label: 'Date of Birth', value: 'January 15, 1988' },
        { label: 'Email', value: 'alex.thompson@email.com' },
        { label: 'Phone', value: '+1 (555) 123-4567', mono: true },
      ],
    },
    {
      title: 'Business Information',
      rows: [
        { label: 'Business Name', value: 'Thompson Design Studio LLC' },
        { label: 'Business Type', value: 'Limited Liability Company' },
        { label: 'Tax ID', value: '**-***7890', mono: true },
        { label: 'Registration Date', value: 'March 10, 2020' },
      ],
    },
  ],
  documentsTitle: 'Submitted Documents',
  documents: [
    {
      id: 'id',
      name: 'Government-issued ID',
      uploadedAt: 'Uploaded on March 18, 2026',
      statusLabel: 'Under Review',
      badgeVariant: 'secondary',
    },
  ],
  nextTitle: 'What happens next?',
  nextDescription:
    "Verification usually takes 24–48 hours. Our team will carefully review your information and documents. You'll receive an email notification once the review is complete.",
  contactSupportLabel: 'Contact Support',
  lastUpdated: 'Last updated: March 18, 2026 at 2:34 PM',
};

export const actionRequiredStatusDefaults = {
  title: 'Action required',
  description: 'Your verification has been rejected. Please review and fix the issues below.',
  feedbackTitle: 'Moderator Feedback',
  feedbackItems: [
    {
      id: 'personal',
      title: 'Personal Information',
      message: 'Date of birth does not match the ID document',
    },
    {
      id: 'personal-duplicate',
      title: 'Personal Information',
      message: 'Date of birth does not match the ID document',
    },
  ],
  stepsTitle: 'Verification Steps',
  steps: [
    { id: 'personal', title: 'Personal Information', statusLabel: 'Needs correction', completed: true },
    { id: 'address', title: 'Address', statusLabel: 'Complete', completed: true },
    {
      id: 'bank',
      title: 'Bank Account Details',
      statusLabel: 'Needs correction',
      detail: 'Date of birth does not match the ID document',
      actionLabel: 'Fix now',
    },
  ],
  documentsTitle: 'Required Documents',
  documents: [
    {
      id: 'license',
      name: 'Business License',
      detail: 'Image is blurry. Please upload a clear, high-resolution photo of your ID.',
      uploadedAt: 'Uploaded on Mar 18, 2026',
      actionLabel: 'Re-upload',
    },
  ],
  primaryActionLabel: 'Fix and resubmit',
};

export const finishVerificationStatusDefaults = {
  title: 'Finish your verification',
  description: 'You need to complete onboarding to activate your account',
  completedSteps: 2,
  totalSteps: 6,
  progressLabel: '2 of 6 steps completed',
  stepsTitle: 'Verification Steps',
  steps: [
    { id: 'personal', title: 'Personal Information', statusLabel: 'Complete', completed: true },
    { id: 'address', title: 'Address', statusLabel: 'Complete', completed: true },
    {
      id: 'bank',
      title: 'Bank Account Details',
      statusLabel: 'Incomplete',
      actionLabel: 'Continue',
    },
    { id: 'tax', title: 'Tax Information', statusLabel: 'Incomplete', actionLabel: 'Continue' },
    { id: 'warehouse', title: 'Warehouse Address', statusLabel: 'Incomplete', actionLabel: 'Continue' },
    { id: 'return', title: 'Return Address', statusLabel: 'Incomplete', actionLabel: 'Continue' },
  ],
  documentsTitle: 'Required Documents',
  documents: [
    {
      id: 'license',
      name: 'Business License',
      detail: 'Required',
      actionLabel: 'Upload',
    },
  ],
  primaryActionLabel: 'Continue onboarding',
};

export const verifiedSellerStatusDefaults = {
  title: "You're verified!",
  badgeLabel: 'Verified Seller',
  description:
    'Congratulations! Your seller account has been approved. Complete the steps below to start selling.',
  approvedOnLabel: 'Approved on March 19, 2026',
  agreementTitle: 'Seller Agreement',
  agreementSignedLabel: 'Agreement signed',
  agreementSignedOn: 'Signed on March 19, 2026',
  nextStepsTitle: 'Next Steps',
  nextSteps: [
    {
      id: 'availability',
      title: 'Set your availability',
      description: "Let customers know when you're available for work",
      actionLabel: 'Set availability',
    },
    {
      id: 'services',
      title: 'Add your services',
      description: 'Create service listings and set your pricing',
      actionLabel: 'Add services',
    },
    {
      id: 'dashboard',
      title: 'Explore your dashboard',
      description: 'Get familiar with your seller tools and analytics',
      actionLabel: 'Go to dashboard',
    },
  ],
  benefitsTitle: 'Verified Seller Benefits',
  benefits: [
    {
      id: 'protection',
      title: 'Data Protection:',
      items: [
        'Your documents are used solely for seller verification',
        'This information is not visible to buyers',
        'Verification is required to access sales and payments',
      ],
    },
    {
      id: 'benefits',
      title: 'Verification Benefits:',
      items: ['Activate your store', 'Enable payouts', 'Increase buyer trust'],
    },
  ],
  documentsTitle: 'Verified Documents',
  documents: [
    { id: 'id', name: 'Government-issued ID', verifiedOn: 'Verified on Mar 18, 2026', statusLabel: 'Verified' },
    { id: 'license', name: 'Business License', verifiedOn: 'Verified on Mar 18, 2026', statusLabel: 'Verified' },
    { id: 'bank', name: 'Bank Statement', verifiedOn: 'Verified on Mar 18, 2026', statusLabel: 'Verified' },
    { id: 'tax', name: 'Tax Certificate', verifiedOn: 'Verified on Mar 18, 2026', statusLabel: 'Verified' },
  ],
  lastUpdated: 'Last updated: March 19, 2026 at 2:34 PM',
};

const COMPLETENESS_KEYS = [
  'personal_complete',
  'tax_complete',
  'address_complete',
  'bank_complete',
  'warehouse_complete',
  'return_complete',
  'documents_complete',
];

export function countCompletedOnboardingSteps(completeness = {}) {
  return COMPLETENESS_KEYS.filter((key) => String(completeness[key]).toLowerCase() === 'true').length;
}
