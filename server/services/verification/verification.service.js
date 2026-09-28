const dns = require('node:dns').promises;
const Lead = require('../../models/Lead');
const AppError = require('../../utils/AppError');
const { fetchPublicPage } = require('./safeHttp');
const { extractEmails, findContactPageUrl } = require('../scraping/scraper.service');
const { scoreLead } = require('../scoring.service');

// Some machines (VPNs, local DNS proxies) only answer ordinary lookups, not MX queries.
// Fall back to public resolvers when the system resolver can't be reached.
const publicResolver = new dns.Resolver({ timeout: 3000, tries: 2 });
publicResolver.setServers(['1.1.1.1', '8.8.8.8']);
const RESOLVER_UNREACHABLE = ['ECONNREFUSED', 'ETIMEOUT', 'ESERVFAIL', 'EREFUSED'];

const resolveMx = async (domain) => {
  try {
    return await dns.resolveMx(domain);
  } catch (err) {
    if (RESOLVER_UNREACHABLE.includes(err.code)) return publicResolver.resolveMx(domain);
    throw err;
  }
};

/** true/false if the email's domain has/lacks mail servers, null if DNS couldn't tell. */
const domainAcceptsMail = async (email) => {
  const domain = email.split('@')[1];
  try {
    const mx = await resolveMx(domain);
    return mx.length > 0;
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') return false;
    return null;
  }
};

class VerificationService {
  /**
   * Re-checks a lead's contact details using only free, public sources:
   *  - website: is it actually online? (a dead website is itself a sales opportunity)
   *  - email:   scraped from the website if missing; domain checked for MX records
   */
  async verifyLead(leadId, ownerId) {
    const lead = await Lead.findOne({ _id: leadId, owner: ownerId });
    if (!lead) throw AppError.notFound('Lead');

    const now = new Date();
    const contact = lead.contact;
    let emailFromSite = false;

    if (contact.website) {
      try {
        const home = await fetchPublicPage(contact.website);
        contact.websiteStatus = 'verified_found';

        let emails = extractEmails(home.html, home.url);
        if (!emails.length) {
          const contactUrl = findContactPageUrl(home.html, home.url);
          if (contactUrl) {
            const page = await fetchPublicPage(contactUrl).catch(() => null);
            if (page) emails = extractEmails(page.html, page.url);
          }
        }
        if (emails.length && (!contact.email || contact.emailStatus !== 'verified_public')) {
          contact.email = emails[0];
          emailFromSite = true;
        }
      } catch (err) {
        console.warn(`[verify] Website check failed for lead ${lead._id}: ${err.message}`);
        contact.websiteStatus = 'verification_failed';
      }
      lead.verification.websiteCheckedAt = now;
    } else {
      contact.websiteStatus = 'not_listed';
    }

    if (contact.email) {
      const acceptsMail = await domainAcceptsMail(contact.email);
      if (acceptsMail === false) contact.emailStatus = 'invalid';
      else if (emailFromSite) contact.emailStatus = 'verified_public';
      else if (contact.emailStatus !== 'verified_public') contact.emailStatus = 'public_unverified';
      lead.verification.emailCheckedAt = now;
    } else {
      contact.emailStatus = 'not_found';
    }

    lead.verification.lastVerifiedAt = now;
    lead.score = scoreLead(lead);
    await lead.save();
    return lead;
  }
}

module.exports = new VerificationService();
