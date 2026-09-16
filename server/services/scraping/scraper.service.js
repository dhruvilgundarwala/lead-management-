const axios = require('axios');
const cheerio = require('cheerio');

class ScraperService {
  constructor() {
    this.timeout = 10000;
  }

  async scrapeHtml(url) {
    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      return cheerio.load(response.data);
    } catch (error) {
      console.error(`Scrape HTML error for ${url}:`, error.message);
      return null;
    }
  }

  extractEmails($) {
    if (!$) return [];
    const text = $('body').text();
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const matches = text.match(emailRegex) || [];
    const validEmails = matches
      .map(e => e.toLowerCase())
      .filter(e => !e.includes('.png') && !e.includes('.jpg') && !e.includes('example.com'))
      .filter((value, index, self) => self.indexOf(value) === index);
    return validEmails;
  }
}

module.exports = new ScraperService();
