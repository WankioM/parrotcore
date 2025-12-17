import React from 'react';
import { AudioVisualizer } from '../components/AudioVisualizer';

export default function About() {
  return (
    <div className="flex flex-col lg:flex-row">
      {/* Left Panel */}
      <div className="split-panel-left lg:w-1/2">
        <h1 className="text-6xl lg:text-7xl font-extrabold mb-12 leading-tight">
          GET TO<br/>KNOW US
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
          <div>
            <h3 className="text-2xl font-bold mb-3">What We Do</h3>
            <p className="opacity-85 leading-relaxed">
              Parrot Core is an AI-powered voice cloning platform that lets you create 
              realistic text-to-speech in your own voice, or transform songs into AI covers.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-3">Why We Built This</h3>
            <p className="opacity-85 leading-relaxed">
              Voice is personal. We believe everyone should have control over their digital 
              voice identity.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-3">The Technology</h3>
            <p className="opacity-85 leading-relaxed">
              We use Chatterbox TTS, RVC for voice conversion, and Demucs for vocal separation.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-3">Open Source</h3>
            <p className="opacity-85 leading-relaxed">
              Built in the open. Your voice, your rules.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="split-panel-right lg:w-1/2 min-h-[50vh] lg:min-h-screen">
        <AudioVisualizer variant="pulse" width={400} height={400} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h2 className="text-5xl font-extrabold text-center leading-tight text-white drop-shadow-2xl">
            Your Voice.<br/>
            Your AI.<br/>
            Your Control.
          </h2>
        </div>
        
        {/* Badge */}
        <div className="absolute bottom-8 right-8 w-20 h-20 rounded-full bg-cayenne border-4 border-white flex items-center justify-center">
          <span className="text-white font-extrabold text-xs text-center leading-tight">
            Parrot<br/>Core
          </span>
        </div>
      </div>
    </div>
  );
}