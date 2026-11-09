const assert = require('node:assert/strict');
const test = require('node:test');
const { authenticateToken } = require('../src/middleware/auth');
const { generateToken } = require('../src/utils/jwt');
const {
  hasAllowedGroup,
  isKeycloakEnabled,
  parseAllowedGroups
} = require('../src/utils/keycloak');

test('parses comma-separated group names without empty entries', () => {
  assert.deepEqual(parseAllowedGroups(' /editors, ,/communications '), [
    '/editors',
    '/communications'
  ]);
});

test('allows only exact membership in a configured group', () => {
  assert.equal(hasAllowedGroup(['/editors'], ['/editors']), true);
  assert.equal(hasAllowedGroup(['/editors/subgroup'], ['/editors']), false);
  assert.equal(hasAllowedGroup(['/other'], []), false);
  assert.equal(hasAllowedGroup(undefined, ['/editors']), false);
});

test('enables Keycloak whenever any Keycloak settings are set', t => {
  const keys = [
    'KEYCLOAK_ISSUER',
    'KEYCLOAK_CLIENT_ID',
    'KEYCLOAK_CLIENT_SECRET',
    'KEYCLOAK_CALLBACK_URL',
    'KEYCLOAK_ALLOWED_GROUPS'
  ];
  const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  t.after(() => {
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  process.env.KEYCLOAK_ISSUER = 'https://keycloak.example/realms/infoboard';
  delete process.env.KEYCLOAK_CLIENT_SECRET;
  delete process.env.KEYCLOAK_ALLOWED_GROUPS;
  delete process.env.KEYCLOAK_CALLBACK_URL;
  delete process.env.KEYCLOAK_CLIENT_ID;
  assert.equal(isKeycloakEnabled(), true);

  process.env.KEYCLOAK_CALLBACK_URL = 'https://infoboard.example/api/admin/callback';
  assert.equal(isKeycloakEnabled(), true);
});

test('rejects local JWTs when Keycloak settings are present', t => {
  const original = process.env.KEYCLOAK_ISSUER;
  process.env.KEYCLOAK_ISSUER = 'https://keycloak.example/realms/infoboard';
  t.after(() => {
    if (original === undefined) delete process.env.KEYCLOAK_ISSUER;
    else process.env.KEYCLOAK_ISSUER = original;
  });

  const req = {
    headers: {
      authorization: ['Bearer', generateToken(1, 'admin')].join(' ')
    }
  };
  let statusCode;
  let calledNext = false;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() {
      return this;
    }
  };

  authenticateToken(req, res, () => { calledNext = true; });
  assert.equal(statusCode, 403);
  assert.equal(calledNext, false);
});
