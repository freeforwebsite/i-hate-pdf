// I HATE PDF — Analytics & Usage Tracking Engine (Unique Member & IP Deduplication)

const ANALYTICS_STORAGE_KEY = 'ihatepdf_usage_analytics';
const VISITOR_ID_KEY = 'ihatepdf_unique_visitor_id';
const SESSION_ACTIVE_KEY = 'ihatepdf_session_active';

function getStoredData() {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return {
    uniqueVisitors: 1,
    pageViews: 1,
    returningVisits: 0,
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

// Track a visitor with Unique ID deduplication
export function trackVisit() {
  const data = getStoredData();
  const existingVisitorId = localStorage.getItem(VISITOR_ID_KEY);
  const isSessionActive = sessionStorage.getItem(SESSION_ACTIVE_KEY);

  // 1. Check if this is a brand new unique user
  if (!existingVisitorId) {
    const newVisitorId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(VISITOR_ID_KEY, newVisitorId);
    data.uniqueVisitors = (data.uniqueVisitors || 0) + 1;
  } else {
    // Returning visitor from the same device / browser
    if (!isSessionActive) {
      data.returningVisits = (data.returningVisits || 0) + 1;
    }
  }

  // Mark session active for this tab
  sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');

  // Increment total pageviews
  data.pageViews = (data.pageViews || 0) + 1;
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

// Get compiled metrics summary with deduplicated users
export function getAnalyticsSummary() {
  const data = getStoredData();
  
  // Sort tools by popularity
  const popularTools = Object.entries(data.toolBreakdown || {})
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);

  return {
    uniqueVisitors: Math.max(1, data.uniqueVisitors || 1),
    pageViews: Math.max(1, data.pageViews || 1),
    returningVisits: data.returningVisits || 0,
    totalProcessed: data.totalProcessed || 0,
    totalBytes: data.totalBytes || 0,
    popularTools,
    recentEvents: data.recentEvents || [],
    deviceType: data.deviceType || 'Desktop'
  };
}
