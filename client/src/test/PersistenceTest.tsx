/**
 * Test component for form persistence (zero data loss on refresh)
 */

import { useState, useEffect } from 'react';
import { useFormPersistence, useOnlineStatus, clearStaleDrafts } from '@/shared/persistence';
import { RefreshCw, Wifi, WifiOff, Trash2, Database } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  message: string;
  priority: string;
}

export function PersistenceTest() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
    priority: 'normal',
  });

  const [serverVersion, setServerVersion] = useState<string>('v1');
  const [eventLog, setEventLog] = useState<string[]>([]);
  const isOnline = useOnlineStatus();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEventLog((prev) => [`${timestamp}: ${message}`, ...prev].slice(0, 20));
  };

  const persistence = useFormPersistence({
    storageKey: 'test-form-persistence',
    data: formData,
    autoSaveInterval: 3000, // 3 seconds for testing
    serverVersion,
    onRestore: (data, metadata) => {
      setFormData(data);
      addLog(`✅ Restored data from ${new Date(metadata.savedAt).toLocaleTimeString()}`);
    },
    onStaleData: (data, metadata) => {
      const age = Math.round((Date.now() - metadata.savedAt) / 1000);
      addLog(`⚠️ Stale data detected (${age}s old)`);
    },
    onConflict: (localData, serverVer) => {
      addLog(`⚠️ Conflict: Local vs Server (${serverVer})`);
    },
  });

  // Log when restored
  useEffect(() => {
    if (persistence.isRestored) {
      if (persistence.hasSavedData) {
        addLog('📦 Persistence initialized with saved data');
      } else {
        addLog('📦 Persistence initialized (no saved data)');
      }
    }
  }, [persistence.isRestored, persistence.hasSavedData]);

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRefresh = () => {
    addLog('🔄 Simulating browser refresh...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleClear = () => {
    persistence.clear();
    setFormData({ name: '', email: '', message: '', priority: 'normal' });
    addLog('🗑️ Cleared saved data');
  };

  const handleClearStale = () => {
    const count = clearStaleDrafts('test-', 10000); // Clear drafts older than 10s
    addLog(`🧹 Cleared ${count} stale draft(s)`);
  };

  const handleSaveToServer = () => {
    // Simulate server save
    const newVersion = `v${parseInt(serverVersion.substring(1)) + 1}`;
    setServerVersion(newVersion);
    persistence.syncWithServer(newVersion);
    addLog(`💾 Synced with server (${newVersion})`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Form Persistence Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test zero data loss on refresh with localStorage persistence
          </p>
        </div>

        {/* Status Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {persistence.hasSavedData ? 'Data saved' : 'No saved data'}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              Server: {serverVersion}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Form (Auto-saves every 3 seconds)
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleFieldChange('message', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your message"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
              <button
                onClick={handleSaveToServer}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Sync to Server
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Data
              </button>
              <button
                onClick={handleClearStale}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear Stale Drafts
              </button>
            </div>
          </div>
        </div>

        {/* Event Log */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Event Log
            </h2>
            <button
              onClick={() => setEventLog([])}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Log
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 max-h-64 overflow-y-auto">
            {eventLog.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No events yet. Start typing or perform an action...
              </p>
            ) : (
              <div className="space-y-1">
                {eventLog.map((log, index) => (
                  <p
                    key={index}
                    className="text-sm font-mono text-gray-700 dark:text-gray-300"
                  >
                    {log}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Testing Instructions
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Type in any field - data auto-saves every 3 seconds</li>
            <li>• Click "Refresh Page" - data will be restored after reload</li>
            <li>• Works offline - data persisted to localStorage</li>
            <li>• "Sync to Server" simulates server save with version tracking</li>
            <li>• "Clear Data" removes saved data from localStorage</li>
            <li>• TTL: 7 days (stale data auto-removed)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
