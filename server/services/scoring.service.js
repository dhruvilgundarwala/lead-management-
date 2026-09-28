/**
 * Opportunity score (0-100): how reachable the business is and how much it needs a website.
 *
 *   Reachability                     Need
 *   +30  email (not known invalid)   +30  no website listed
 *   +25  phone                       +20  website listed but dead/unreachable
 *   +10  street address
 *   +5   social page (active online, but no site of their own)
 */
const scoreLead = ({ contact = {}, location = {} }) => {
  let score = 0;

  if (contact.email && contact.emailStatus !== 'invalid') score += 30;
  if (contact.phone) score += 25;
  if (location.address) score += 10;
  if (contact.social?.facebook || contact.social?.instagram) score += 5;

  if (!contact.website) score += 30;
  else if (contact.websiteStatus === 'verification_failed') score += 20;

  return Math.min(score, 100);
};

module.exports = { scoreLead };
