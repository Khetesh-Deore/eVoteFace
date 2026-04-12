/**
 * Rate Limit Monitoring and Analytics
 */

class RateLimitMonitor {
  constructor() {
    this.violations = [];
    this.stats = {
      totalViolations: 0,
      violationsByIP: new Map(),
      violationsByEndpoint: new Map(),
      blockedIPs: new Set(),
    };
    
    // Cleanup old violations every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  /**
   * Log a rate limit violation
   */
  logViolation(req, limitType) {
    const violation = {
      timestamp: new Date(),
      ip: req.ip || req.connection.remoteAddress,
      endpoint: req.originalUrl || req.url,
      method: req.method,
      limitType,
      userAgent: req.get('user-agent'),
      userId: req.user?._id || req.user?.id,
      adminId: req.admin?._id || req.admin?.id,
    };

    this.violations.push(violation);
    this.stats.totalViolations++;

    // Track by IP
    const ipCount = this.stats.violationsByIP.get(violation.ip) || 0;
    this.stats.violationsByIP.set(violation.ip, ipCount + 1);

    // Track by endpoint
    const endpointCount = this.stats.violationsByEndpoint.get(violation.endpoint) || 0;
    this.stats.violationsByEndpoint.set(violation.endpoint, endpointCount + 1);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Rate Limit] ${violation.ip} exceeded ${limitType} limit on ${violation.endpoint}`);
    }

    // Check for suspicious patterns
    this.detectSuspiciousActivity(violation);
  }

  /**
   * Detect suspicious activity patterns
   */
  detectSuspiciousActivity(violation) {
    const recentViolations = this.getRecentViolations(5 * 60 * 1000); // Last 5 minutes
    const ipViolations = recentViolations.filter(v => v.ip === violation.ip);

    // Alert if single IP has many violations
    if (ipViolations.length >= 10) {
      this.alert('HIGH_FREQUENCY_VIOLATIONS', {
        ip: violation.ip,
        count: ipViolations.length,
        timeWindow: '5 minutes',
      });
    }

    // Alert if distributed attack (many IPs hitting same endpoint)
    const endpointViolations = recentViolations.filter(v => v.endpoint === violation.endpoint);
    const uniqueIPs = new Set(endpointViolations.map(v => v.ip));
    
    if (uniqueIPs.size >= 20) {
      this.alert('DISTRIBUTED_ATTACK', {
        endpoint: violation.endpoint,
        uniqueIPs: uniqueIPs.size,
        totalViolations: endpointViolations.length,
        timeWindow: '5 minutes',
      });
    }

    // Alert if rapid login attempts
    if (violation.endpoint.includes('/login')) {
      const loginViolations = recentViolations.filter(v => v.endpoint.includes('/login'));
      if (loginViolations.length >= 50) {
        this.alert('BRUTE_FORCE_ATTACK', {
          endpoint: violation.endpoint,
          attempts: loginViolations.length,
          timeWindow: '5 minutes',
        });
      }
    }
  }

  /**
   * Send alert for suspicious activity
   */
  alert(type, data) {
    const alert = {
      type,
      timestamp: new Date(),
      data,
    };

    console.error(`[SECURITY ALERT] ${type}:`, JSON.stringify(data, null, 2));

    // TODO: Send to monitoring service (Sentry, DataDog, etc.)
    // TODO: Send email to admin
    // TODO: Trigger automated response (block IP, enable CAPTCHA, etc.)
  }

  /**
   * Get recent violations within time window
   */
  getRecentViolations(timeWindowMs) {
    const cutoff = Date.now() - timeWindowMs;
    return this.violations.filter(v => v.timestamp.getTime() > cutoff);
  }

  /**
   * Get statistics
   */
  getStats() {
    const recentViolations = this.getRecentViolations(60 * 60 * 1000); // Last hour

    return {
      total: this.stats.totalViolations,
      lastHour: recentViolations.length,
      topIPs: this.getTopViolators(this.stats.violationsByIP, 10),
      topEndpoints: this.getTopViolators(this.stats.violationsByEndpoint, 10),
      blockedIPs: Array.from(this.stats.blockedIPs),
      recentAlerts: this.getRecentAlerts(10),
    };
  }

  /**
   * Get top violators
   */
  getTopViolators(map, limit) {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => ({ key, count }));
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit) {
    // TODO: Implement alert storage
    return [];
  }

  /**
   * Block an IP address
   */
  blockIP(ip, reason) {
    this.stats.blockedIPs.add(ip);
    console.warn(`[Rate Limit] Blocked IP: ${ip} - Reason: ${reason}`);
    
    // TODO: Add to persistent blocklist
    // TODO: Notify admin
  }

  /**
   * Unblock an IP address
   */
  unblockIP(ip) {
    this.stats.blockedIPs.delete(ip);
    console.log(`[Rate Limit] Unblocked IP: ${ip}`);
  }

  /**
   * Check if IP is blocked
   */
  isBlocked(ip) {
    return this.stats.blockedIPs.has(ip);
  }

  /**
   * Cleanup old violations
   */
  cleanup() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // Keep 24 hours
    this.violations = this.violations.filter(v => v.timestamp.getTime() > cutoff);
    
    console.log(`[Rate Limit] Cleaned up old violations. Current count: ${this.violations.length}`);
  }

  /**
   * Export violations for analysis
   */
  exportViolations(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.violations, null, 2);
    }
    
    if (format === 'csv') {
      const headers = ['timestamp', 'ip', 'endpoint', 'method', 'limitType', 'userId', 'adminId'];
      const rows = this.violations.map(v => [
        v.timestamp.toISOString(),
        v.ip,
        v.endpoint,
        v.method,
        v.limitType,
        v.userId || '',
        v.adminId || '',
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return this.violations;
  }

  /**
   * Generate report
   */
  generateReport() {
    const stats = this.getStats();
    const recentViolations = this.getRecentViolations(60 * 60 * 1000);

    return {
      summary: {
        totalViolations: stats.total,
        lastHour: stats.lastHour,
        blockedIPs: stats.blockedIPs.length,
      },
      topViolators: {
        byIP: stats.topIPs,
        byEndpoint: stats.topEndpoints,
      },
      recentActivity: recentViolations.slice(-20).map(v => ({
        time: v.timestamp.toISOString(),
        ip: v.ip,
        endpoint: v.endpoint,
        type: v.limitType,
      })),
      blockedIPs: stats.blockedIPs,
    };
  }
}

// Singleton instance
const monitor = new RateLimitMonitor();

module.exports = monitor;
