const jwt = require('jsonwebtoken');
const Joi = require('joi');
const config = require('../config');
const { query } = require('../config/db');

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      geographic_scope: user.geographic_scope
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: 'refresh'
    },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
  );
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token d accès JWT requis (Bearer <token>)' });
  }

  jwt.verify(token, config.JWT_SECRET, async (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Session expirée. Veuillez vous reconnecter ou rafraîchir le jeton.', code: 'TOKEN_EXPIRED' });
      }
      return res.status(403).json({ success: false, error: 'Token invalide', code: 'INVALID_TOKEN' });
    }

    try {
      // Check user is still active in database
      const userRes = await query('SELECT id, email, full_name, role, geographic_scope, is_active FROM users WHERE id = ?', [decoded.id]);
      if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
        return res.status(403).json({ success: false, error: 'Compte utilisateur inactif ou révoqué', code: 'USER_INACTIVE' });
      }

      req.user = userRes.rows[0];
      next();
    } catch (dbErr) {
      console.error('[Auth Middleware] Erreur vérification utilisateur :', dbErr);
      return res.status(500).json({ success: false, error: 'Erreur interne de vérification' });
    }
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Non authentifié' });
    }

    const userRole = req.user.role;
    // Map composite requester roles
    const userRoleComposite = (userRole === 'REQUESTER') 
      ? `REQUESTER_${req.user.geographic_scope}` 
      : userRole;

    const hasAccess = roles.includes(userRole) || roles.includes(userRoleComposite) || userRole === 'ADMIN';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: `Accès refusé. Le rôle '${userRole}' n'est pas autorisé pour cette opération. Rôles autorisés: ${roles.join(', ')}`
      });
    }
    next();
  };
}

function requireScope(targetScope) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Non authentifié' });
    }
    if (req.user.geographic_scope === 'GLOBAL' || req.user.role === 'ADMIN') {
      return next();
    }
    if (targetScope && req.user.geographic_scope !== targetScope) {
      return res.status(403).json({
        success: false,
        error: `Périmètre territorial non autorisé (${req.user.geographic_scope} vs ${targetScope})`
      });
    }
    next();
  };
}

// Joi Validation Schemas
const schemas = {
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Format d adresse email invalide',
      'any.required': 'L email est requis'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
      'any.required': 'Le mot de passe est requis'
    })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Format d adresse email invalide',
      'any.required': 'L email est requis'
    })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Le jeton de réinitialisation est requis'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Le mot de passe doit comporter au moins 6 caractères',
      'any.required': 'Le nouveau mot de passe est requis'
    })
  }),

  createUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('VENDOR', 'REQUESTER', 'MASTER_DATA_AGENT', 'MANAGER_APPROVAL', 'ADMIN').required(),
    geographic_scope: Joi.string().valid('WESTERN', 'NORDIC', 'TGBST', 'GLOBAL').default('GLOBAL')
  }),

  updateUser: Joi.object({
    full_name: Joi.string().min(2).max(100).optional(),
    role: Joi.string().valid('VENDOR', 'REQUESTER', 'MASTER_DATA_AGENT', 'MANAGER_APPROVAL', 'ADMIN').optional(),
    geographic_scope: Joi.string().valid('WESTERN', 'NORDIC', 'TGBST', 'GLOBAL').optional(),
    is_active: Joi.boolean().optional()
  })
};

function validate(schemaKey) {
  return (req, res, next) => {
    const schema = schemas[schemaKey];
    if (!schema) return next();

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const details = error.details.map(d => d.message).join(', ');
      return res.status(400).json({ success: false, error: details });
    }
    next();
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateToken: generateAccessToken, // Backwards compatibility
  authenticateToken,
  requireRole,
  requireScope,
  validate
};
