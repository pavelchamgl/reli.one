const COMPLETENESS_LABELS = {
  seller_type_selected: 'Seller type',
  personal_complete: 'Personal details',
  tax_complete: 'Tax info',
  address_complete: 'Address',
  bank_complete: 'Bank account',
  warehouse_complete: 'Warehouse',
  return_complete: 'Return address',
  documents_complete: 'Documents',
};

export function parseOnboardingApiErrors(data) {
  if (!data) return ['Unknown error'];

  if (typeof data === 'string') return [data];
  if (data.detail) return [String(data.detail)];
  if (data.message) return [String(data.message)];

  const completeness = data.completeness ?? data;

  if (completeness && typeof completeness === 'object' && !Array.isArray(completeness)) {
    const failed = Object.entries(completeness)
      .filter(
        ([, value]) => typeof value === 'string' && value.toLowerCase() === 'false'
      )
      .map(([key]) => COMPLETENESS_LABELS[key] ?? key);

    if (failed.length) {
      return [`Please complete: ${failed.join(', ')}`];
    }
  }

  const messages = [];

  const walk = (obj) => {
    if (!obj) return;

    if (typeof obj === 'string') {
      messages.push(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach(walk);
    } else if (typeof obj === 'object') {
      Object.values(obj).forEach(walk);
    }
  };

  walk(data);

  return messages.length ? messages : ['Unexpected error'];
}

export function formatOnboardingRequestError(requestName, data) {
  const messages = parseOnboardingApiErrors(data);
  return `${requestName}: ${messages.join(', ')}`;
}
