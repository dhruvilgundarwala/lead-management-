const LEAD_STATUSES = ['NEW', 'READY', 'CONTACTED', 'FOLLOW_UP_DUE', 'FOLLOW_UP_SENT', 'REPLIED', 'QUALIFIED', 'WON', 'LOST', 'ARCHIVED'];
const EMAIL_STATUSES = ['verified_public', 'public_unverified', 'not_found', 'invalid', 'unknown'];
const WEBSITE_STATUSES = ['verified_found', 'not_listed', 'likely_none', 'unknown', 'verification_failed'];
const WEBSITE_REQUIREMENTS = ['missing', 'required', 'any'];
const CAMPAIGN_STATUSES = ['Draft', 'Active', 'Scheduled', 'Completed'];
const FOLLOW_UP_STATUSES = ['Pending', 'Completed', 'Cancelled'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const EMAIL_TONES = ['professional', 'friendly', 'persuasive'];

module.exports = {
  LEAD_STATUSES,
  EMAIL_STATUSES,
  WEBSITE_STATUSES,
  WEBSITE_REQUIREMENTS,
  CAMPAIGN_STATUSES,
  FOLLOW_UP_STATUSES,
  PRIORITIES,
  EMAIL_TONES,
};
