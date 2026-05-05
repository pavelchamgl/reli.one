#!/usr/bin/env bash

echo "Running post-agent safety check..."

echo ""
echo "Changed files:"
git diff --name-only

echo ""
echo "Potential secret-like changes:"
git diff --cached -- . ':!package-lock.json' ':!*.lock' | grep -Ei "SECRET|PASSWORD|TOKEN|PRIVATE KEY|BEGIN RSA|API_KEY|STRIPE|PAYPAL" || true

echo ""
echo "Reminder:"
echo "- Run backend tests if backend changed"
echo "- Run frontend build/lint if frontend changed"
echo "- Review API contract if serializers/views changed"
echo "- Review migrations if models changed"