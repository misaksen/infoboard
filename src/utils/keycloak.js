const { Issuer, generators } = require('openid-client');

const pendingAuthorizations = new Map();
let clientPromise;
const AUTHORIZATION_TTL = 10 * 60 * 1000;
const MAX_PENDING_AUTHORIZATIONS = 1000;

function isKeycloakEnabled() {
  return Boolean(
    process.env.KEYCLOAK_ISSUER ||
    process.env.KEYCLOAK_CLIENT_ID ||
    process.env.KEYCLOAK_CLIENT_SECRET ||
    process.env.KEYCLOAK_CALLBACK_URL ||
    process.env.KEYCLOAK_ALLOWED_GROUPS
  );
}

function parseAllowedGroups(value = process.env.KEYCLOAK_ALLOWED_GROUPS || '') {
  return value.split(',').map(group => group.trim()).filter(Boolean);
}

function hasAllowedGroup(userGroups, allowedGroups) {
  return Array.isArray(userGroups) &&
    allowedGroups.length > 0 &&
    userGroups.some(group => allowedGroups.includes(group));
}

function getClient() {
  if (!process.env.KEYCLOAK_ISSUER || !process.env.KEYCLOAK_CLIENT_ID ||
      !process.env.KEYCLOAK_CALLBACK_URL || parseAllowedGroups().length === 0) {
    throw new Error('Keycloak issuer, client ID, callback URL, and allowed groups must be configured');
  }

  if (!clientPromise) {
    const issuerUrl = process.env.KEYCLOAK_ISSUER;
    clientPromise = Issuer.discover(issuerUrl).then(issuer => new issuer.Client({
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET || undefined,
      redirect_uris: [process.env.KEYCLOAK_CALLBACK_URL],
      response_types: ['code']
    })).catch(error => {
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}

async function getAuthorizationUrl() {
  const client = await getClient();
  const now = Date.now();
  for (const [state, authorization] of pendingAuthorizations) {
    if (authorization.expiresAt <= now) {
      pendingAuthorizations.delete(state);
    }
  }
  while (pendingAuthorizations.size >= MAX_PENDING_AUTHORIZATIONS) {
    pendingAuthorizations.delete(pendingAuthorizations.keys().next().value);
  }

  const state = generators.state();
  const nonce = generators.nonce();
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  pendingAuthorizations.set(state, {
    nonce,
    codeVerifier,
    expiresAt: now + AUTHORIZATION_TTL
  });

  return {
    url: client.authorizationUrl({
      scope: 'openid profile',
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    }),
    state
  };
}

async function completeAuthorization(request) {
  const client = await getClient();
  const params = client.callbackParams(request);
  const state = typeof params.state === 'string' ? params.state : null;
  const stateCookie = String(request.headers.cookie || '')
    .split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith('keycloak_state='))
    ?.slice('keycloak_state='.length);
  const authorization = state && pendingAuthorizations.get(state);
  if (!authorization || state !== stateCookie || authorization.expiresAt <= Date.now()) {
    if (state) pendingAuthorizations.delete(state);
    throw new Error('Invalid or expired Keycloak authorization state');
  }
  pendingAuthorizations.delete(state);

  const tokenSet = await client.callback(
    process.env.KEYCLOAK_CALLBACK_URL,
    params,
    {
      state,
      nonce: authorization.nonce,
      code_verifier: authorization.codeVerifier
    }
  );
  const claims = tokenSet.claims();
  const userInfo = tokenSet.access_token
    ? await client.userinfo(tokenSet.access_token)
    : {};
  const user = { ...claims, ...userInfo };
  const allowedGroups = parseAllowedGroups();

  if (!hasAllowedGroup(user.groups, allowedGroups)) {
    throw new Error('User is not a member of an allowed Keycloak group');
  }

  return {
    id: user.sub,
    username: user.preferred_username || user.name || user.sub
  };
}

module.exports = {
  completeAuthorization,
  getAuthorizationUrl,
  hasAllowedGroup,
  isKeycloakEnabled,
  parseAllowedGroups
};
