/**
 * Request Logger Middleware
 * Logs all incoming requests with detailed information
 */

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Get user info if authenticated
  const userInfo = req.user ? {
    id: req.user.id || req.user.userId,
    username: req.user.username,
    role: req.user.role
  } : null;

  // Sanitize request body to hide sensitive information
  const sanitizeBody = (body) => {
    if (!body || typeof body !== 'object') return body;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'creditCard', 'ssn'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  };

  // Log request details
  const logData = {
    timestamp,
    method: req.method,
    path: req.path,
    route: req.route ? req.route.path : req.originalUrl,
    fullUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body: req.body && Object.keys(req.body).length > 0 ? sanitizeBody(req.body) : undefined,
    params: req.params && Object.keys(req.params).length > 0 ? req.params : undefined,
    user: userInfo,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
    hasFile: !!req.file || !!req.files,
    fileInfo: req.file ? {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : undefined
  };

  // Log the request
  console.log('\n' + '='.repeat(80));
  console.log(`📥 [${timestamp}] ${req.method} ${req.originalUrl}`);
  console.log('─'.repeat(80));
  
  // Log key information in a readable format
  if (logData.query) {
    console.log('Query Params:', JSON.stringify(logData.query));
  }
  if (logData.params) {
    console.log('Route Params:', JSON.stringify(logData.params));
  }
  if (logData.body) {
    console.log('Request Body:', JSON.stringify(logData.body, null, 2));
  }
  if (logData.user) {
    console.log('User:', JSON.stringify(logData.user));
  }
  if (logData.fileInfo) {
    console.log('File Upload:', JSON.stringify(logData.fileInfo));
  }
  if (logData.ip) {
    console.log('IP Address:', logData.ip);
  }
  
  console.log('─'.repeat(80));

  // Log response when request finishes
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const responseData = {
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      success: res.statusCode >= 200 && res.statusCode < 300
    };

    // Get response body if available (for successful responses, we'll log it)
    const statusEmoji = res.statusCode >= 200 && res.statusCode < 300 ? '✅' : 
                        res.statusCode >= 400 && res.statusCode < 500 ? '⚠️' : 
                        res.statusCode >= 500 ? '❌' : 'ℹ️';

    console.log(`${statusEmoji} Response:`, JSON.stringify(responseData, null, 2));
    
    if (res.statusCode >= 400) {
      console.error(`[ERROR] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Time: ${responseTime}ms`);
    }
    
    console.log('='.repeat(80) + '\n');
  });

  next();
};

module.exports = requestLogger;

