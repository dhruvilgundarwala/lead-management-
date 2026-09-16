const axios = require('axios');
const scraperService = require('../scraping/scraper.service');
const Lead = require('../../models/Lead');

class VerificationService {
  
  async checkWebsiteAvailability(url) {
    if (!url) return 'likely_none';
    
    let checkUrl = url;
    if (!checkUrl.startsWith('http')) checkUrl = 'http://' + checkUrl;
    
    try {
      await axios.head(checkUrl, { 
        timeout: 8000,
        validateStatus: (status) => status < 400
      });
      return 'verified_found';
    } catch (error) {
      try {
        await axios.get(checkUrl, { timeout: 8000, validateStatus: (status) => status < 400 });
        return 'verified_found';
      } catch (e) {
        return 'verification_failed';
      }
    }
  }

  async verifyLead(leadId) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error('Lead not found');

    if (!lead.verification) {
      lead.verification = {};
    }

    let websiteStatus = lead.contact?.websiteStatus || 'unknown';
    let email = lead.contact?.email;
    let emailStatus = lead.contact?.emailStatus || 'unknown';
    
    if (lead.contact.website && websiteStatus !== 'verified_found') {
      websiteStatus = await this.checkWebsiteAvailability(lead.contact.website);
      lead.contact.websiteStatus = websiteStatus;
      lead.verification.websiteCheckedAt = new Date();
    }

    if (websiteStatus === 'verified_found' && lead.contact.website) {
      let url = lead.contact.website;
      if (!url.startsWith('http')) url = 'http://' + url;
      
      const $ = await scraperService.scrapeHtml(url);
      if ($) {
        const foundEmails = scraperService.extractEmails($);
        if (foundEmails.length > 0) {
          if (!email || emailStatus !== 'verified_public') {
            email = foundEmails[0]; 
            emailStatus = 'verified_public';
          }
        }
      }
      lead.verification.emailCheckedAt = new Date();
    }

    lead.contact.email = email;
    lead.contact.emailStatus = emailStatus;
    lead.verification.lastVerifiedAt = new Date();
    
    let newScore = 0;
    if (email) newScore += 30;
    if (lead.contact.phone) newScore += 10;
    if (websiteStatus === 'verified_found') newScore += 10;
    if (lead.location.address) newScore += 10;
    lead.score = newScore;
    
    await lead.save();
    return lead;
  }
}

module.exports = new VerificationService();
