import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Seller onboarding page shell. Uses legacy SellerHeader from SellerPage — no duplicate shell header.
 */
export function SellerOnboardingLayout({ children, className, contentClassName }) {
  return (
    <div
      className={cn(
        'min-h-screen overflow-x-hidden bg-[#F8FAFC] text-foreground',
        className,
      )}
    >
      <main
        className={cn(
          'mx-auto flex w-full max-w-[896px] flex-col gap-6 px-4 py-6 sm:py-7 md:px-0',
          contentClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}

export function SellerOnboardingCard({ children, className }) {
  return (
    <Card
      className={cn(
        'w-full rounded-xl border border-[#E5E7EB] bg-card shadow-[0_4px_24px_-4px_rgba(15,23,42,0.12)]',
        className,
      )}
    >
      <CardContent className="space-y-4 p-4 sm:p-8">{children}</CardContent>
    </Card>
  );
}
