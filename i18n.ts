import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    locale = 'en'; // Provide a default value if locale is undefined
  }
  
  // Load messages from your JSON files
  const messages = (await import(`./public/locales/${locale}.json`)).default;
  
  return {
    locale,
    messages,
    timeZone: 'UTC'
  };
});
