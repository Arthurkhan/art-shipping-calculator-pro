import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Bug, Copy, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ShippingRate } from '@/types/shipping';

interface DebugMessage {
  timestamp: string;
  message: string;
  data: unknown[];
}

interface DebugPanelProps {
  rates: ShippingRate[];
  isCalculating: boolean;
  lastResponse?: {
    success: boolean;
    rates?: ShippingRate[];
    error?: string;
    requestId?: string;
  };
}

export const DebugPanel = ({ rates, isCalculating, lastResponse }: DebugPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [copiedSection, setCopiedSection] = useState('');
  const [debugData, setDebugData] = useState<Record<string, unknown>>({});

  // Listen for debug messages from the console
  useEffect(() => {
    // Override console.log temporarily to capture debug data
    const originalLog = console.log;
    const debugCapture: DebugMessage[] = [];
    
    console.log = function(...args: unknown[]) {
      originalLog.apply(console, args);
      
      // Capture specific debug patterns
      const firstArg = args[0];
      if (typeof firstArg === 'string' && 
          (firstArg.includes('FedEx') || firstArg.includes('rate') || firstArg.includes('response'))) {
        debugCapture.push({
          timestamp: new Date().toISOString(),
          message: firstArg,
          data: args.slice(1)
        });
      }
    };

    // Restore original console.log on cleanup
    return () => {
      console.log = originalLog;
    };
  }, []);

  const copyToClipboard = (data: unknown, section: string) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(''), 2000);
  };

  const formatCurrency = (amount: string | number | undefined, currency: string) => {
    if (typeof amount === 'number') return `${currency} ${amount.toFixed(2)}`;
    if (typeof amount === 'string') return `${currency} ${parseFloat(amount).toFixed(2)}`;
    return `${currency} 0.00`;
  };

  // Toggle debug panel visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(!showDebug);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showDebug]);

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowDebug(true)}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Show Debug Panel (Ctrl+Shift+D)"
        >
          <Bug className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Bug className="w-5 h-5 mr-2" />
          <h3 className="font-semibold">Debug Panel</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-white/20 p-1 rounded"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowDebug(false)}
            className="hover:bg-white/20 p-1 rounded"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[520px]">
        {/* Status */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${isCalculating ? 'text-blue-600' : 'text-green-600'}`}>
              {isCalculating ? 'Calculating...' : 'Ready'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Rates Found:</span>
            <span className="font-medium">{rates.length}</span>
          </div>
        </div>

        {/* Rates Analysis */}
        {rates.length > 0 && (
          <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Rate Analysis</h4>
              <button
                onClick={() => copyToClipboard(rates, 'rates')}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Copy className="w-3 h-3 mr-1" />
                {copiedSection === 'rates' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="space-y-2">
              {rates.map((rate, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                  <div className="font-medium text-gray-700">{rate.service}</div>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-gray-600">
                    <div>Cost: {formatCurrency(rate.cost, rate.currency)}</div>
                    <div>Transit: {rate.transitTime}</div>
                    <div className="col-span-2">
                      Raw Cost Value: <code className="bg-gray-200 px-1 rounded">{JSON.stringify(rate.cost)}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 bg-blue-50 border-b border-blue-100">
          <h4 className="font-semibold text-sm text-blue-900 mb-2">Debug Instructions</h4>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Open browser console (F12)</li>
            <li>Click "Calculate Shipping Rates"</li>
            <li>Look for messages starting with "FedEx rate response data"</li>
            <li>Copy the full response data and share it</li>
            <li>The response should contain the actual rate amounts</li>
          </ol>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="p-3">
            <h4 className="font-semibold text-sm mb-2">Raw Response Preview</h4>
            <div className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto">
              <pre>{JSON.stringify(rates, null, 2)}</pre>
            </div>
            <Alert className="mt-3">
              <AlertDescription className="text-xs">
                Check the browser console for complete FedEx API response details. Look for log entries containing "FedEx rate response data (full for debugging)".
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-3 bg-gray-50 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Press Ctrl+Shift+D to toggle</span>
            <span className="text-blue-600">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};