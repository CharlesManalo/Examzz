import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

declare global {
  interface Window { adsbygoogle: unknown[]; }
}

interface AdModalProps {
  onClose: () => void;
  destination: string;
  onNavigate: (page: string) => void;
}

export default function AdModal({ onClose, destination, onNavigate }: AdModalProps) {
  const [countdown, setCountdown] = useState(5); // 5 sec before X appears

  useEffect(() => {
    // Push ad
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}

    // Countdown timer
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClose = () => {
    onClose();
    onNavigate(destination);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-xs text-gray-400 font-medium">Advertisement</span>
          {countdown > 0 ? (
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-1">
              Skip in {countdown}s
            </span>
          ) : (
            <button
              onClick={handleClose}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1"
            >
              <X className="h-3 w-3" /> Skip
            </button>
          )}
        </div>

        {/* Ad Content */}
        <div className="p-4 min-h-[250px] flex items-center justify-center bg-gray-50">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', minHeight: '250px', width: '100%' }}
            data-ad-client="ca-pub-9849203865786211"
            data-ad-slot="6330239352"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            You'll be redirected after closing this ad
          </p>
        </div>
      </div>
    </div>
  );
}
