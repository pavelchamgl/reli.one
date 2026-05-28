import { ReviewSectionCard } from './ReviewSectionCard';
import { SellerReviewPageView } from './SellerReviewPageView';

export function ReviewSectionsView({
  title,
  description,
  step,
  totalSteps,
  stepLabel,
  sections,
  editingSectionId,
  renderEditSection,
  submitLabel,
  submitError,
  isSubmittable,
  isSubmitting,
  onSubmit,
  onEditSection,
  editLabel,
}) {
  return (
    <SellerReviewPageView
      title={title}
      description={description}
      step={step}
      totalSteps={totalSteps}
      stepLabel={stepLabel}
      submitLabel={submitLabel}
      submitError={submitError}
      isSubmittable={isSubmittable}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    >
      {sections.map((section) =>
        editingSectionId === section.id ? (
          <div key={section.id}>{renderEditSection(section.id)}</div>
        ) : (
          <ReviewSectionCard
            key={section.id}
            iconSrc={section.iconSrc}
            title={section.title}
            rows={section.rows}
            blocks={section.blocks}
            documents={section.documents}
            editLabel={editLabel}
            onEdit={onEditSection ? () => onEditSection(section.id) : undefined}
          />
        )
      )}
    </SellerReviewPageView>
  );
}
