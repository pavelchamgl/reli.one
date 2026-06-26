/** UI-строки для Playwright при захвате скриншотов документации. */
export const LOCALE_CONFIGS = {
  en: {
    outSubdir: 'en',
    i18nextLng: 'en',
    browserLocale: 'en-GB',
    l: {
      createAccount: 'Create an account',
      buyerAccount: 'Buyer account',
      sellerCreateTitle: 'Create Your Seller Account',
      verifyEmail: /verify your email|verification code/i,
      chooseSellerType: 'Choose your seller type',
      sellerInfo: 'Seller information',
      reviewInfo: 'Review your information',
      applicationSubmitted: 'Your application has been submitted',
      selfEmployedPrefill: 'Prefill Czech business/tax details',
      companyPrefill: 'Prefill Czech company legal data',
      loadFromRegistry: 'Load from public registry',
      loadFromAres: 'Load from ARES',
      publicRegistryPreview: 'Public registry preview',
      aresPreview: 'ARES preview',
      registerHere: /Register here/i,
      sellerLogin: 'Log in to seller panel',
      deleteAccount: /delete your account/i,
      goodsList: 'List of goods',
      goodsCreation: 'Creation of goods',
      previewModeration: /cancel|sending for moderation/i,
      onModeration: 'On moderation',
    },
  },
  cz: {
    outSubdir: 'cz',
    i18nextLng: 'cz',
    browserLocale: 'cs-CZ',
    l: {
      createAccount: 'Vytvořit účet',
      buyerAccount: 'Účet kupujícího',
      sellerCreateTitle: 'Vytvořte si účet prodejce',
      verifyEmail: /Ověřte svůj e-mail|ověřovací kód/i,
      chooseSellerType: 'Vyberte typ prodejce',
      sellerInfo: 'Informace o prodejci',
      reviewInfo: 'Zkontrolujte své údaje',
      applicationSubmitted: 'Vaše žádost byla odeslána',
      selfEmployedPrefill: 'Předvyplnit české podnikatelské a daňové údaje',
      companyPrefill: 'Předvyplnit právní údaje české společnosti',
      loadFromRegistry: 'Načíst z veřejného rejstříku',
      loadFromAres: 'Načíst z ARES',
      publicRegistryPreview: 'Náhled z veřejného rejstříku',
      aresPreview: 'Náhled z ARES',
      registerHere: /Registrujte se zde/i,
      sellerLogin: 'Přihlásit se do prodejního panelu',
      deleteAccount: /delete your account/i,
      goodsList: 'Seznam zboží',
      goodsCreation: 'Vytvoření zboží',
      previewModeration: /zrušit|odesílání k moderaci/i,
      onModeration: 'Ve schvalování',
    },
  },
};

export function parseCaptureLocales() {
  const raw = (process.env.DOCS_LOCALE || 'all').toLowerCase();
  if (raw === 'all') return ['en', 'cz'];
  if (raw === 'cs') return ['cz'];
  if (raw === 'cz') return ['cz'];
  if (raw === 'en') return ['en'];
  throw new Error(`Unknown DOCS_LOCALE: ${raw}. Use en, cz, cs, or all.`);
}
