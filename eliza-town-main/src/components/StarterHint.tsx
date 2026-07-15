import { useEffect, useState } from 'react';

const HINT_KEY = 'eliza-town-controls-hint-seen';

export default function StarterHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(HINT_KEY)) {
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 12000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-md pointer-events-auto">
      <div className="bg-[#23202b]/95 border-2 border-[#4a3b5b] px-5 py-4 text-center font-dialog shadow-lg">
        <p className="text-[#e0dce6] text-sm leading-relaxed">
          <span className="text-[#a395b8] uppercase tracking-wide text-xs block mb-2">
            Quick start
          </span>
          Click anywhere to walk. Click a character to view their conversations.
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(HINT_KEY, '1');
            setVisible(false);
          }}
          className="mt-3 text-xs uppercase tracking-wider text-[#a395b8] hover:text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
