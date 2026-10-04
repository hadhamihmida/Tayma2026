const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const config = require('../config');
const { query } = require('../config/db');
const {
  generateAccessToken,
  generateRefreshToken,
  authenticateToken,
  validate
} = require('../middlewares/auth');
const auditService = require('../services/auditService');
const jwt = require('jsonwebtoken');

// Rate limiting on login route: max 15 requests per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Trop de tentatives de connexion depuis cette adresse IP. Veuillez patienter 15 minutes.'
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, validate('login'), async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';

  try {
    const { email, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const result = await query('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);

    if (result.rows.length === 0) {
      await auditService.logAction({
        userId: null,
        action: 'AUTH_LOGIN_FAILURE',
        oldValue: { email: cleanEmail },
        newValue: { reason: 'Utilisateur inexistant' },
        ipAddress,
        userAgent
      });
      return res.status(401).json({ success: false, error: 'Identifiants invalides (email ou mot de passe incorrect).' });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      await auditService.logAction({
        userId: user.id,
        action: 'AUTH_LOGIN_BLOCKED',
        oldValue: { is_active: false },
        newValue: { reason: 'Tentative de connexion sur compte inactif' },
        ipAddress,
        userAgent
      });
      return res.status(403).json({
        success: false,
        error: 'Ce compte utilisateur a été désactivé par l administration. Contactez votre responsable Master Data.'
      });
    }

    // Check if account is locked
    const now = new Date();
    if (user.locked_until && new Date(user.locked_until) > now) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until) - now) / 60000);
      await auditService.logAction({
        userId: user.id,
        action: 'AUTH_LOGIN_BLOCKED',
        oldValue: { locked_until: user.locked_until },
        newValue: { remainingMinutes },
        ipAddress,
        userAgent
      });
      return res.status(423).json({
        success: false,
        error: `Compte temporairement verrouillé pour des raisons de sécurité suite à 5 échecs consécutifs. Réessayez dans ${remainingMinutes} minute(s) ou utilisez 'Mot de passe oublié'.`,
        locked: true,
        remainingMinutes
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      let lockedUntil = null;
      let isNowLocked = false;

      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        isNowLocked = true;
        await query('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?', [attempts, lockedUntil, user.id]);

        await auditService.logAction({
          userId: user.id,
          action: 'AUTH_ACCOUNT_LOCKED',
          oldValue: { failed_login_attempts: user.failed_login_attempts },
          newValue: { locked_until: lockedUntil, reason: '5 tentatives erronées consécutives' },
          ipAddress,
          userAgent
        });

        return res.status(423).json({
          success: false,
          error: 'Compte verrouillé pour 15 minutes suite à 5 tentatives erronées consécutives. Utilisez "Mot de passe oublié" pour le débloquer.',
          locked: true,
          remainingMinutes: 15
        });
      } else {
        await query('UPDATE users SET failed_login_attempts = ? WHERE id = ?', [attempts, user.id]);

        await auditService.logAction({
          userId: user.id,
          action: 'AUTH_LOGIN_FAILURE',
          oldValue: { failed_attempts: user.failed_login_attempts },
          newValue: { failed_attempts: attempts },
          ipAddress,
          userAgent
        });

        const remaining = 5 - attempts;
        return res.status(401).json({
          success: false,
          error: `Mot de passe incorrect. Attention : plus que ${remaining} tentative(s) avant verrouillage de sécurité temporaire.`
        });
      }
    }

    // Password is valid - reset lock and attempts
    await query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Persist refresh token
    const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshToken, refreshExpires]
    );

    // Audit log
    await auditService.logAction({
      userId: user.id,
      action: 'AUTH_LOGIN_SUCCESS',
      oldValue: null,
      newValue: { role: user.role, scope: user.geographic_scope },
      ipAddress,
      userAgent
    });

    return res.json({
      success: true,
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        geographic_scope: user.geographic_scope,
        is_active: Boolean(user.is_active)
      }
    });
  } catch (err) {
    console.error('[Auth Route] Erreur login :', err);
    return res.status(500).json({ success: false, error: 'Erreur interne lors de la tentative de connexion.' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token requis' });
    }

    jwt.verify(refreshToken, config.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ success: false, error: 'Refresh token invalide ou expiré' });
      }

      // Check if token exists in DB
      const tokenRes = await query('SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > CURRENT_TIMESTAMP', [refreshToken]);
      if (tokenRes.rows.length === 0) {
        return res.status(403).json({ success: false, error: 'Session révoquée ou introuvable' });
      }

      // Load user
      const userRes = await query('SELECT id, email, full_name, role, geographic_scope, is_active FROM users WHERE id = ?', [decoded.id]);
      if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
        return res.status(403).json({ success: false, error: 'Compte inactif' });
      }

      const user = userRes.rows[0];
      const newAccessToken = generateAccessToken(user);

      return res.json({
        success: true,
        token: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          geographic_scope: user.geographic_scope
        }
      });
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const ipAddress = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }

    // If request had Authorization header, log audit
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.id) {
          await auditService.logAction({
            userId: decoded.id,
            action: 'AUTH_LOGOUT',
            oldValue: null,
            newValue: { email: decoded.email },
            ipAddress,
            userAgent
          });
        }
      } catch (e) {
        // Ignore decode errors on logout
      }
    }

    return res.json({ success: true, message: 'Déconnexion effectuée avec succès.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', validate('forgotPassword'), async (req, res) => {
  const ipAddress = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';

  try {
    const { email } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const userRes = await query('SELECT id, email, full_name FROM users WHERE LOWER(email) = ?', [cleanEmail]);

    if (userRes.rows.length === 0) {
      // For security, don't leak whether email exists
      return res.json({
        success: true,
        message: 'Si cet email correspond à un compte actif, des instructions de réinitialisation vous ont été transmises.'
      });
    }

    const user = userRes.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      'UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?',
      [resetToken, expiresAt, user.id]
    );

    await auditService.logAction({
      userId: user.id,
      action: 'AUTH_PASSWORD_RESET_REQUESTED',
      oldValue: null,
      newValue: { email: cleanEmail },
      ipAddress,
      userAgent
    });

    return res.json({
      success: true,
      message: 'Lien de réinitialisation généré.',
      // Provided in development/demo mode to easily test the soutenance workflow:
      demo_reset_token: resetToken,
      demo_instructions: 'Utilisez ce jeton pour définir un nouveau mot de passe directement dans la fenêtre modale.'
    });
  } catch (err) {
    console.error('[Auth Route] Erreur forgot-password :', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la demande de réinitialisation.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', validate('resetPassword'), async (req, res) => {
  const ipAddress = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';

  try {
    const { token, password } = req.body;

    const userRes = await query(
      'SELECT id, email FROM users WHERE reset_token = ? AND reset_token_expires_at > CURRENT_TIMESTAMP',
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le jeton de réinitialisation est invalide ou a expiré. Veuillez renouveler votre demande.'
      });
    }

    const user = userRes.rows[0];
    const newPasswordHash = await bcrypt.hash(password, 10);

    await query(
      `UPDATE users 
       SET password_hash = ?, 
           reset_token = NULL, 
           reset_token_expires_at = NULL, 
           failed_login_attempts = 0, 
           locked_until = NULL 
       WHERE id = ?`,
      [newPasswordHash, user.id]
    );

    // Invalidate old refresh tokens
    await query('DELETE FROM refresh_tokens WHERE user_id = ?', [user.id]);

    await auditService.logAction({
      userId: user.id,
      action: 'AUTH_PASSWORD_RESET_COMPLETED',
      oldValue: null,
      newValue: { email: user.email },
      ipAddress,
      userAgent
    });

    return res.json({
      success: true,
      message: 'Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.'
    });
  } catch (err) {
    console.error('[Auth Route] Erreur reset-password :', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la réinitialisation du mot de passe.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    return res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role,
        geographic_scope: req.user.geographic_scope,
        is_active: Boolean(req.user.is_active)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/demo-users (Mode démo discret pour la soutenance)
router.get('/demo-users', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, full_name, role, geographic_scope, is_active 
       FROM users 
       WHERE is_active = 1
       ORDER BY FIELD(role, 'ADMIN', 'MANAGER_APPROVAL', 'MASTER_DATA_AGENT', 'REQUESTER', 'VENDOR')`
    );

    // Map into friendly personas
    const demoAccounts = result.rows.map(u => {
      let roleLabel = u.role;
      if (u.role === 'REQUESTER') {
        roleLabel = u.geographic_scope === 'NORDIC' ? 'REQUESTER_NORDIC' : 'REQUESTER_WESTERN';
      }
      return {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        roleLabel,
        geographic_scope: u.geographic_scope,
        default_password: 'Password123!'
      };
    });

    return res.json({
      success: true,
      users: demoAccounts,
      default_password: 'Password123!'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
