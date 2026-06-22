import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import {
  SellerOnboardingCard,
  OnboardingStepHeader,
} from '@/Components/Seller/onboarding';

export function SellerTypeContentView({
  title,
  description,
  step,
  totalSteps,
  stepLabel,
  selectedType,
  onSelectType,
  onContinue,
  isContinueDisabled,
  isLoading,
  selfEmployedTitle,
  selfEmployedDesc,
  selfEmployedIcon,
  companyTitle,
  companyDesc,
  companyIcon,
  continueLabel,
}) {
  const options = [
    {
      type: 'self_employed',
      title: selfEmployedTitle,
      description: selfEmployedDesc,
      icon: selfEmployedIcon,
    },
    {
      type: 'company',
      title: companyTitle,
      description: companyDesc,
      icon: companyIcon,
    },
  ];

  return (
    <SellerOnboardingCard>
      <OnboardingStepHeader
        title={title}
        description={description}
        step={step}
        totalSteps={totalSteps}
        stepLabel={stepLabel}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedType === option.type;
          return (
            <button
              key={option.type}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectType(option.type)}
              className={cn(
                'relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/40'
              )}
            >
              {option.icon ? (
                <img src={option.icon} alt="" className="h-10 w-10 object-contain" />
              ) : null}
              <div className="space-y-1">
                <h2 className="text-base font-semibold">{option.title}</h2>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              {isSelected ? (
                <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-primary" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>
      {selectedType ? (
        <Button
          type="button"
          onClick={onContinue}
          disabled={isContinueDisabled || isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? `${continueLabel}…` : continueLabel}
        </Button>
      ) : null}
    </SellerOnboardingCard>
  );
}
