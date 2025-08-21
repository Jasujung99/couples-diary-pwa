"use client";

import { useState } from "react";

export default function TestComponentsPage() {
  const [message, setMessage] = useState("Components are working!");

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-ink mb-4">
          Component Test
        </h1>
        <p className="text-ink/70 mb-8">
          {message}
        </p>
        <button
          onClick={() => setMessage("Button clicked!")}
          className="px-4 py-2 bg-gold text-ink rounded-lg hover:bg-gold/80 transition-colors"
        >
          Test Button
        </button>
        
        <div className="mt-8 space-y-4">
          <div className="p-4 bg-lilac rounded-lg">
            <h3 className="font-semibold text-ink mb-2">Onboarding Features</h3>
            <ul className="text-sm text-ink/70 space-y-1">
              <li>✅ Multi-page animated introduction</li>
              <li>✅ Smooth transitions between screens</li>
              <li>✅ Skip functionality</li>
              <li>✅ Progress indicators</li>
            </ul>
          </div>
          
          <div className="p-4 bg-mint rounded-lg">
            <h3 className="font-semibold text-ink mb-2">Authentication Features</h3>
            <ul className="text-sm text-ink/70 space-y-1">
              <li>✅ Google OAuth integration</li>
              <li>✅ Kakao OAuth integration</li>
              <li>✅ Error handling with user-friendly messages</li>
              <li>✅ Loading states</li>
            </ul>
          </div>
          
          <div className="p-4 bg-ice rounded-lg">
            <h3 className="font-semibold text-ink mb-2">Flow Management</h3>
            <ul className="text-sm text-ink/70 space-y-1">
              <li>✅ Onboarding completion tracking</li>
              <li>✅ Authentication state management</li>
              <li>✅ Smooth page transitions</li>
              <li>✅ Responsive design</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8">
          <a
            href="/"
            className="text-ink/60 hover:text-ink underline"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}