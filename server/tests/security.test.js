process.env.NODE_ENV = 'test';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { assertPublicUrl, isPrivateIp, safeLookup, fetchPublicPage } = require('../services/verification/safeHttp');
const { extractEmails } = require('../services/scraping/scraper.service');
const { scoreLead } = require('../services/scoring.service');

describe('SSRF protection', () => {
  test('classifies private and public IPs', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1']) {
      assert.equal(isPrivateIp(ip), true, ip);
    }
    for (const ip of ['8.8.8.8', '172.32.0.1', '1.1.1.1', '2606:4700:4700::1111']) {
      assert.equal(isPrivateIp(ip), false, ip);
    }
  });

  test('rejects dangerous URLs before any request', () => {
    for (const url of [
      'file:///etc/passwd',
      'http://127.0.0.1/',
      'http://[::1]/',
      'http://169.254.169.254/latest/meta-data',
      'http://localhost/',
      'http://example.com:27017/',
      'http://user:pass@example.com/',
      'not a url',
    ]) {
      assert.throws(() => assertPublicUrl(url), undefined, url);
    }
    assert.equal(assertPublicUrl('https://example.com/contact').hostname, 'example.com');
  });

  test('DNS lookup refuses hostnames that resolve to private IPs', (t, done) => {
    safeLookup('localhost', {}, (err) => {
      assert.ok(err, 'expected localhost to be blocked');
      done();
    });
  });

  test('fetchPublicPage refuses internal targets', async () => {
    await assert.rejects(fetchPublicPage('http://127.0.0.1:5000/api/v1/health'));
  });
});

describe('extractEmails', () => {
  test('prefers mailto links and same-domain addresses, ignores junk', () => {
    const html = `<body>
      <a href="mailto:owner@gmail.com?subject=hi">Mail</a>
      Contact: hello@shop.in or logo@2x.png, user@example.com
    </body>`;
    assert.deepEqual(extractEmails(html, 'https://www.shop.in'), ['hello@shop.in', 'owner@gmail.com']);
  });
});

describe('scoreLead', () => {
  test('a reachable business without a website scores highest', () => {
    const best = scoreLead({
      contact: { email: 'a@b.in', emailStatus: 'public_unverified', phone: '1', social: { facebook: 'fb' } },
      location: { address: 'x' },
    });
    assert.equal(best, 100);
  });

  test('invalid email earns nothing; dead website still counts as an opportunity', () => {
    const score = scoreLead({
      contact: { email: 'a@b.in', emailStatus: 'invalid', website: 'https://dead.in', websiteStatus: 'verification_failed' },
      location: {},
    });
    assert.equal(score, 20);
  });
});
