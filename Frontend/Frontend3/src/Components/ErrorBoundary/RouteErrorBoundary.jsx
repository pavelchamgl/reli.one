import { useRouteError } from "react-router-dom";

import ErrorBoundary from "./ErrorBoundary";

function ThrowRouteError({ error }) {
  throw error instanceof Error ? error : new Error(String(error));
}

/**
 * errorElement для React Router: пробрасывает route error в ErrorBoundary,
 * чтобы показать управляемый фолбэк и Sentry-лог с translation_likely_active.
 */
export default function RouteErrorBoundary({ area = "app" }) {
  const error = useRouteError();

  return (
    <ErrorBoundary area={area}>
      <ThrowRouteError error={error} />
    </ErrorBoundary>
  );
}
