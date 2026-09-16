const { Groq } = require('groq-sdk');
const env = require('../../config/env');

class AIService {
  constructor() {
    this.groq = new Groq({ apiKey: env.GROQ_API_KEY });
  }

  async parseSearchPrompt(prompt) {
    const systemPrompt = `You are an AI assistant that extracts lead search parameters from natural language.
Convert the user's prompt into a JSON object matching this exact schema:
{
  "industry": "string (e.g. Interior Design, Plumber)",
  "category": "string (snake_case representation of industry, e.g. interior_design)",
  "location": {
    "city": "string",
    "state": "string (optional)",
    "country": "string (optional)"
  },
  "limit": number (default 20, max 100),
  "websiteRequirement": "string (one of: 'required', 'missing', 'any')",
  "emailRequired": boolean,
  "phoneRequired": boolean,
  "filters": []
}

Output ONLY valid JSON without any markdown formatting or extra text.`;

    const modelsToTry = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];

    for (const model of modelsToTry) {
      try {
        const completion = await this.groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          model,
          temperature: 0.1,
          response_format: { type: "json_object" },
        });

        const responseText = completion.choices[0]?.message?.content;
        if (responseText) {
          return JSON.parse(responseText);
        }
      } catch (error) {
        console.warn(`Groq Model ${model} failed:`, error.message);
      }
    }

    console.log('Using local fallback parser for prompt:', prompt);
    return this.fallbackParsePrompt(prompt);
  }

  fallbackParsePrompt(prompt) {
    const lower = prompt.toLowerCase();
    
    // Extract limit
    let limit = 20;
    const limitMatch = lower.match(/(?:find|get|fetch|top|limit)?\s*(\d+)/i);
    if (limitMatch) {
      const num = parseInt(limitMatch[1], 10);
      if (num > 0 && num <= 100) limit = num;
    }

    // Extract location (city)
    let city = 'Tokyo';
    const locationMatch = lower.match(/(?:in|near|around|at|for)\s+([a-z\s]+?)(?:\s+(?:without|with|having|that|and|for|\d+|$))/i);
    if (locationMatch && locationMatch[1]) {
      const candidate = locationMatch[1].trim();
      const reserved = ['a website', 'email', 'phone', 'website', 'a public email', 'public email'];
      if (candidate && !reserved.includes(candidate)) {
        city = candidate.split(' ')[0];
        city = city.charAt(0).toUpperCase() + city.slice(1);
      }
    }

    // Extract website requirement
    let websiteRequirement = 'any';
    if (lower.includes('without a website') || lower.includes('no website') || lower.includes('lacking website')) {
      websiteRequirement = 'missing';
    } else if (lower.includes('with a website') || lower.includes('has website') || lower.includes('have a website')) {
      websiteRequirement = 'required';
    }

    // Extract category & industry
    let category = 'interior_design';
    let industry = 'Interior Design';

    if (lower.includes('cafe') || lower.includes('coffee')) {
      category = 'cafe';
      industry = 'Cafes & Coffee Shops';
    } else if (lower.includes('restaurant') || lower.includes('dining')) {
      category = 'restaurant';
      industry = 'Restaurants';
    } else if (lower.includes('account') || lower.includes('cpa')) {
      category = 'accounting';
      industry = 'Accounting Firms';
    } else if (lower.includes('plumb')) {
      category = 'plumber';
      industry = 'Plumbing Services';
    } else if (lower.includes('dentist') || lower.includes('dental')) {
      category = 'dentist';
      industry = 'Dental Clinics';
    } else if (lower.includes('gym') || lower.includes('fitness')) {
      category = 'gym';
      industry = 'Fitness & Gyms';
    } else if (lower.includes('salon') || lower.includes('spa') || lower.includes('hair')) {
      category = 'salon';
      industry = 'Beauty Salons';
    } else if (lower.includes('hotel') || lower.includes('resort')) {
      category = 'hotel';
      industry = 'Hotels & Hospitality';
    } else if (lower.includes('law') || lower.includes('lawyer') || lower.includes('attorney')) {
      category = 'lawyer';
      industry = 'Legal Services';
    }

    return {
      industry,
      category,
      location: {
        city,
        state: '',
        country: ''
      },
      limit,
      websiteRequirement,
      emailRequired: lower.includes('email'),
      phoneRequired: lower.includes('phone'),
      filters: []
    };
  }

  async generateEmail(lead, context) {
    const systemPrompt = `You are an expert B2B copywriter who writes high-converting cold emails for a SaaS agency.
The goal is to offer web design and digital marketing services to businesses that lack a modern online presence.
Keep the email under 150 words, highly personalized, and conversational. Do not use generic corporate jargon.
Return a JSON object with 'subject' and 'body'.`;

    const userPrompt = `Write an email for this lead:
Company: ${lead.business.name}
Industry: ${lead.business.industry}
Location: ${lead.location.city || ''}
Has Website: ${lead.contact.website ? 'Yes' : 'No'}
Context/Angle: ${context}

Format:
{
  "subject": "string",
  "body": "string"
}`;

    const modelsToTry = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];

    for (const model of modelsToTry) {
      try {
        const completion = await this.groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model,
          temperature: 0.7,
          response_format: { type: "json_object" },
        });

        const responseText = completion.choices[0]?.message?.content;
        if (responseText) {
          return JSON.parse(responseText);
        }
      } catch (error) {
        console.warn(`Groq Model ${model} failed for email generation:`, error.message);
      }
    }

    return {
      subject: `Quick question regarding ${lead.business.name}'s digital presence`,
      body: `Hi ${lead.business.name} team,\n\nI came across your business in ${lead.location.city || 'your area'} and noticed an opportunity to significantly increase your local customer reach.\n\nWe help ${lead.business.industry || 'local businesses'} elevate their online presence and capture more high-value inquiries directly.\n\nWould you be open to a quick 5-minute chat next week to see how we could help grow your lead flow?\n\nBest regards,\nAI Lead Finder Team`
    };
  }
}

module.exports = new AIService();

