const dns = require('node:dns');
const net = require('node:net');
const http = require('node:http');
const https = require('node:https');
const axios = require('axios');
const env = require('../../config/env');

/**
 * HTTP client for fetching user-supplied URLs (lead websites) without SSRF risk:
 * only http(s) on standard ports, and every resolved IP (including after redirects)
 * must be public, so a lead website like http://localhost:27017 or http://169.254.169.254 is refused.
 */

const BLOCKED_V4 = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 3],
];

const ipv4ToInt = (ip) => ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;

const isPrivateIPv4 = (ip) =>
  BLOCKED_V4.some(([range, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipv4ToInt(ip) & mask) === (ipv4ToInt(range) & mask);
  });

const isPrivateIp = (ip) => {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (!net.isIPv6(ip)) return true;
  const v6 = ip.toLowerCase();
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return v6 === '::' || v6 === '::1' || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) || v6.startsWith('ff');
};

class BlockedUrlError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BlockedUrlError';
  }
}

/** Throws if a URL is not a plain public http(s) URL. Does not resolve DNS (safeLookup does that). */
const assertPublicUrl = (value) => {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new BlockedUrlError('Invalid URL');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new BlockedUrlError('Only http(s) URLs are allowed');
  if (url.port && !['80', '443'].includes(url.port)) throw new BlockedUrlError('Non-standard ports are not allowed');
  if (url.username || url.password) throw new BlockedUrlError('Credentials in URLs are not allowed');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  // IP literals skip DNS lookup entirely, so they must be checked here.
  if (net.isIP(host) && isPrivateIp(host)) throw new BlockedUrlError('Private addresses are not allowed');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new BlockedUrlError('Local hostnames are not allowed');
  }
  return url;
};

const safeLookup = (hostname, options, callback) => {
  dns.lookup(hostname, options, (err, address, family) => {
    if (err) return callback(err);
    const addresses = Array.isArray(address) ? address : [{ address, family }];
    if (addresses.some((a) => isPrivateIp(a.address))) {
      return callback(new BlockedUrlError(`${hostname} resolves to a private address`));
    }
    return callback(null, address, family);
  });
};

const client = axios.create({
  timeout: 10000,
  maxRedirects: 3,
  maxContentLength: 2 * 1024 * 1024,
  responseType: 'text',
  proxy: false,
  httpAgent: new http.Agent({ lookup: safeLookup }),
  httpsAgent: new https.Agent({ lookup: safeLookup }),
  headers: { 'User-Agent': env.OSM_USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
  validateStatus: (status) => status < 400,
  beforeRedirect: (options) => {
    assertPublicUrl(`${options.protocol}//${options.hostname}${options.port ? `:${options.port}` : ''}/`);
  },
});

/** GETs a public URL. Resolves with { url, html } or rejects (including BlockedUrlError). */
const fetchPublicPage = async (value) => {
  const url = assertPublicUrl(value);
  const res = await client.get(url.toString());
  return { url: res.request?.res?.responseUrl || url.toString(), html: typeof res.data === 'string' ? res.data : '' };
};

module.exports = { fetchPublicPage, assertPublicUrl, isPrivateIp, safeLookup, BlockedUrlError };
