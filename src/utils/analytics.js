// I HATE PDF — Analytics & Usage Tracking Engine

const ANALYTICS_STORAGE_KEY = 'ihatepdf_usage_analytics';

function getStoredData() {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return {
    totalVisits: 1,
    uniqueSessions: 1,
    firstVisit: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    totalProcessed: 0,
    totalBytes: 0,
    toolBreakdown: {},
    deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
    recentEvents: []
  };
}

function saveData(data) {
  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

// Track a visitor pageview
export function trackVisit() {
  const data = getStoredData();
  data.totalVisits = (data.totalVisits || 0) + 1;
  data.lastActive = new Date().toISOString();
  saveData(data);
}

// Track when a user processes any document tool
export function trackToolUsage(toolId, toolName, fileSizeBytes = 0) {
  const data = getStoredData();
  data.totalProcessed = (data.totalProcessed || 0) + 1;
  data.totalBytes = (data.totalBytes || 0) + (fileSizeBytes || 0);

  // Increment tool category counter
  data.toolBreakdown[toolId] = (data.toolBreakdown[toolId] || 0) + 1;

  // Add to recent activity log
  const event = {
    id: 'evt_' + Date.now(),
    toolId,
    toolName: toolName || toolId,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString()
  };

  data.recentEvents = [event, ...(data.recentEvents || [])].slice(0, 20);
  saveData(data);
}

// Get compiled metrics summary
export function getAnalyticsSummary() {
  const data = getStoredData();
  
  // Sort tools by popularity
  const popularTools = Object.entries(data.toolBreakdown || {})
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalVisits: Math.max(1, data.totalVisits || 1),
    totalProcessed: data.totalProcessed || 0,
    totalBytes: data.totalBytes || 0,
    popularTools,
    recentEvents: data.recentEvents || [],
    deviceType: data.deviceType || 'Desktop'
  };
}
