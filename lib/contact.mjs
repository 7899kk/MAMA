const EMAIL = /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
let tokenCache = null;
export function settingsFromEnvironment(env = process.env) {
  return {to: env.CONTACT_TO || '', from: env.GMAIL_FROM || env.CONTACT_TO || '', accessToken: env.GMAIL_ACCESS_TOKEN || '', clientId: env.GMAIL_OAUTH_CLIENT_ID || '', clientSecret: env.GMAIL_OAUTH_CLIENT_SECRET || '', refreshToken: env.GMAIL_OAUTH_REFRESH_TOKEN || ''};
}
export function isConfigured(settings) {
  return EMAIL.test(settings.to) && EMAIL.test(settings.from) && Boolean(settings.accessToken || (settings.clientId && settings.clientSecret && settings.refreshToken));
}
export function validateContact(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const {name, email, message, website = ''} = body;
  if ([name, email, message, website].some(value => typeof value !== 'string')) return null;
  if (website || name.trim().length < 2 || name.length > 100 || /[\r\n\x00-\x1f]/.test(name) || email.length > 254 || !EMAIL.test(email) || message.trim().length < 10 || message.length > 4000 || /\x00/.test(message)) return null;
  return {name: name.trim(), email, message: message.trim()};
}
function allowedByRateLimit(ip) {
  const now = Date.now();
  for (const [key, entry] of attempts) if (now - entry.started >= WINDOW_MS) attempts.delete(key);
  let entry = attempts.get(ip);
  if (!entry) {
    if (attempts.size >= 2000) return false;
    entry = {started: now, count: 0};attempts.set(ip, entry);
  }
  entry.count += 1;
  return entry.count <= 5;
}
async function accessToken(settings, fetcher) {
  if (settings.accessToken) return settings.accessToken;
  if (tokenCache && tokenCache.source === settings.refreshToken && tokenCache.expires > Date.now() + 60000) return tokenCache.value;
  const response = await fetcher('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({client_id: settings.clientId, client_secret: settings.clientSecret, refresh_token: settings.refreshToken, grant_type: 'refresh_token'}), signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Gmail authentication unavailable');
  const token = await response.json();
  if (typeof token.access_token !== 'string' || !token.access_token) throw new Error('Gmail authentication unavailable');
  tokenCache = {source: settings.refreshToken, value: token.access_token, expires: Date.now() + Math.max(60, Number(token.expires_in) || 3600) * 1000};
  return token.access_token;
}
export function encodeMessage(contact, settings) {
  const subject = Buffer.from(`Portfolio message from ${contact.name}`).toString('base64');
  const text = `Name: ${contact.name}\nEmail: ${contact.email}\n\n${contact.message}`;
  const body = Buffer.from(text, 'utf8').toString('base64').match(/.{1,76}/g).join('\r\n');
  const mime = [`From: Portfolio <${settings.from}>`, `To: ${settings.to}`, `Reply-To: ${contact.email}`, `Subject: =?UTF-8?B?${subject}?=`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', body].join('\r\n');
  return Buffer.from(mime).toString('base64url');
}
export async function processContact(body, {settings = settingsFromEnvironment(), fetcher = globalThis.fetch, ip = 'unknown'} = {}) {
  const contact = validateContact(body);
  if (!contact) return {status: 422, body: {error: 'Please enter a valid name, email, and a message of at least 10 characters.'}};
  if (!isConfigured(settings)) return {status: 503, body: {error: 'The contact form is temporarily unavailable. Please connect on LinkedIn.'}};
  if (!allowedByRateLimit(ip)) return {status: 429, body: {error: 'Too many messages. Please try again in 15 minutes.'}};
  try {
    const token = await accessToken(settings, fetcher);
    const response = await fetcher('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST', headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({raw: encodeMessage(contact, settings)}), signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error('Gmail delivery unavailable');
    const result = await response.json();
    if (!result.id || typeof result.id !== 'string') throw new Error('Gmail did not confirm acceptance');
    return {status: 200, body: {ok: true, message: 'Your message has been sent. Thank you for getting in touch!'}};
  } catch {
    return {status: 502, body: {error: 'Your message could not be sent. Please try again later or connect on LinkedIn.'}};
  }
}
export async function handleContactRequest(req, res) {
  res.setHeader('Cache-Control', 'no-store');res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const respond = (status, body) => {res.statusCode = status;res.end(JSON.stringify(body));};
  if (req.method === 'GET') return respond(200, {configured: isConfigured(settingsFromEnvironment())});
  if (req.method !== 'POST') {res.setHeader('Allow', 'GET, POST');return respond(405, {error: 'Method not allowed.'});}
  let origin;
  try {origin = new URL(req.headers.origin || '');} catch {return respond(403, {error: 'This request is not allowed.'});}
  const allowedOrigin = process.env.PUBLIC_ORIGIN;
  if ((allowedOrigin && origin.origin !== allowedOrigin) || (!allowedOrigin && origin.host !== req.headers.host)) return respond(403, {error: 'This request is not allowed.'});
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return respond(415, {error: 'Please send JSON.'});
  if (Number(req.headers['content-length']) > 10000) {req.resume?.();return respond(413, {error: 'Message is too large.'});}
  try {
    let body = req.body;
    if (body === undefined) {
      const chunks = [];let size = 0;
      for await (const chunk of req) {size += chunk.length;if (size > 10000) return respond(413, {error: 'Message is too large.'});chunks.push(chunk);}
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } else if (typeof body === 'string') {
      if (Buffer.byteLength(body) > 10000) return respond(413, {error: 'Message is too large.'});body = JSON.parse(body);
    } else if (Buffer.byteLength(JSON.stringify(body)) > 10000) return respond(413, {error: 'Message is too large.'});
    const result = await processContact(body, {ip: req.socket?.remoteAddress || 'unknown'});
    return respond(result.status, result.body);
  } catch {return respond(400, {error: 'Invalid request. Please try again.'});}
}
