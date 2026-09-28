const cheerio = require('cheerio');

const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}/gi;
const IGNORED_EMAIL = /\.(png|jpe?g|gif|svg|webp|css|js)$|@(example|domain|email|sentry|wixpress|sentry-next)\.|^(your|name|user|test)@/i;

/**
 * Extracts public email addresses from an HTML page. `mailto:` links are trusted most;
 * addresses on the site's own domain are ranked first.
 */
const extractEmails = (html, siteUrl) => {
  if (!html) return [];
  const $ = cheerio.load(html);

  const fromLinks = $('a[href^="mailto:"]')
    .map((_, el) => decodeURIComponent(($(el).attr('href') || '').slice(7).split('?')[0]))
    .get();
  const fromText = $('body').text().match(EMAIL_REGEX) || [];

  const siteDomain = siteUrl ? new URL(siteUrl).hostname.replace(/^www\./, '') : '';
  const unique = [...new Set([...fromLinks, ...fromText].map((e) => e.trim().toLowerCase()))].filter(
    (e) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e) && !IGNORED_EMAIL.test(e)
  );

  return unique.sort((a, b) => Number(b.endsWith(`@${siteDomain}`)) - Number(a.endsWith(`@${siteDomain}`)));
};

/** Finds a same-site "contact" page link, if any. */
const findContactPageUrl = (html, siteUrl) => {
  if (!html) return null;
  const $ = cheerio.load(html);
  const href = $('a[href]')
    .map((_, el) => $(el).attr('href'))
    .get()
    .find((h) => /contact/i.test(h) && !/^mailto:|^tel:/i.test(h));
  if (!href) return null;
  try {
    const url = new URL(href, siteUrl);
    return url.hostname === new URL(siteUrl).hostname ? url.toString() : null;
  } catch {
    return null;
  }
};

module.exports = { extractEmails, findContactPageUrl };
