const { verifyToken } = require('../utils/jwt');
const { isKeycloakEnabled } = require('../utils/keycloak');

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  if (isKeycloakEnabled() && decoded.authProvider !== 'keycloak') {
    return res.status(403).json({ error: 'Keycloak authentication required' });
  }
  
  req.userId = decoded.userId;
  req.userName = decoded.userName;
  next();
}

module.exports = {
  authenticateToken
};
