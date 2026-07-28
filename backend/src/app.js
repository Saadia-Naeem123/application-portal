require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { clientUrls, nodeEnv } = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const departmentRoutes = require('./routes/department.routes');
const applicationTypeRoutes = require('./routes/applicationType.routes');
const routingRuleRoutes = require('./routes/routingRule.routes');
const holidayRoutes = require('./routes/holiday.routes');
const semesterBreakRoutes = require('./routes/semesterBreak.routes');
const workingSaturdayRoutes = require('./routes/workingSaturday.routes');
const calendarRoutes = require('./routes/calendar.routes');
const permissionRoutes = require('./routes/permission.routes');
const applicationRoutes = require('./routes/application.routes');
const notificationRoutes = require('./routes/notification.routes');
const jobRoutes = require('./routes/job.routes');
const searchRoutes = require('./routes/search.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const auditLogRoutes = require('./routes/auditLog.routes');
const systemSettingRoutes = require('./routes/systemSetting.routes');

const app = express();

// Render (and most PaaS providers) sit behind a reverse proxy. Without this,
// Express sees every request as HTTP from an internal IP, which breaks
// `secure` cookies (req.secure is always false) and makes express-rate-limit
// key off the proxy's IP instead of the real client IP.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, server-to-server, health checks)
      // that don't send an Origin header at all.
      if (!origin || clientUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
// gzip/deflate API responses — cheap win for JSON payload sizes (analytics,
// search, and list endpoints in particular) with negligible CPU cost.
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
if (nodeEnv !== 'test') {
  // Route morgan's access-log lines through the same structured logger the
  // rest of the app uses, instead of writing straight to stdout, so they
  // land in logs/app.log alongside everything else in production.
  app.use(
    morgan(nodeEnv === 'development' ? 'dev' : 'combined', {
      stream: { write: (line) => logger.info(line.trim()) },
    })
  );
}

// General API-wide throttle — a coarse backstop against scripted abuse or a
// runaway client, independent of the tighter per-route limiters below.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.', errors: [] },
});
app.use('/api/', apiLimiter);

// Tighter limit on auth routes specifically (brute-force login/registration
// protection), scoped by IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.', errors: [] },
});


app.get('/health', (req, res) => res.status(200).json({ success: true, message: 'OK' }));

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/application-types', applicationTypeRoutes);
app.use('/api/v1/routing-rules', routingRuleRoutes);
app.use('/api/v1/holidays', holidayRoutes);
app.use('/api/v1/semester-breaks', semesterBreakRoutes);
app.use('/api/v1/working-saturdays', workingSaturdayRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/permissions', permissionRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin/jobs', jobRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/settings', systemSettingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
