import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Shared seller onboarding page shell (presentational).
 * Header reuse of legacy SellerHeader — FE-018+; pass logo/lang via headerRight for now.
 */
export function SellerOnboardingLayout({
  children,
  headerRight,
  className,
  contentClassName,
}) {
  return (
    <div className={cn('min-h-screen bg-background text-foreground', className)}>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="text-base font-semibold tracking-tight">Reli.one</div>
          {headerRight ? (
            <div className="flex shrink-0 items-center gap-2">{headerRight}</div>
          ) : null}
        </div>
      </header>
      <main
        className={cn(
          'mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8 sm:px-6',
          contentClassName
        )}
      >
        {children}
      </main>
    </div>
  );
}

export function SellerOnboardingCard({ children, className }) {
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="space-y-6 p-6">{children}</CardContent>
    </Card>
  );
}
