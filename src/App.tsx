import React, { useEffect, useState } from 'react';
import Phaser from 'phaser';
import MainScene from './game/MainScene';
import { GAME_CONFIG } from './game/constants';
import { Heart, Zap, Crosshair, Trophy, Pause } from 'lucide-react';

const App: React.FC = () => {
  const [health, setHealth] = useState(100);
  const [fuel, setFuel] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [kills, setKills] = useState(0);
  const [game, setGame] = useState<Phaser.Game | null>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'game-container',
      ...GAME_CONFIG,
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const newGame = new Phaser.Game(config);
    setGame(newGame);

    // Listen for events from Phaser
    const handleReady = () => {
      const scene = newGame.scene.getScene('MainScene') as MainScene;
      if (scene) {
        scene.events.on('update-health', (val: number) => setHealth(val));
        scene.events.on('update-fuel', (val: number) => setFuel(val));
        scene.events.on('update-ammo', (val: number) => setAmmo(val));
        scene.events.on('update-kills', (val: number) => setKills(val));
      }
    };

    newGame.events.on('ready', handleReady);

    return () => {
      newGame.destroy(true);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-sans">
      {/* Game Container */}
      <div id="game-container" className="w-full h-full" />

      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
        {/* Left Stats: Health & Fuel */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-lg border border-white/10 w-64 shadow-xl">
            <Heart className="text-red-500 fill-red-500 animate-pulse" size={24} />
            <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                style={{ width: `${health}%` }}
              />
            </div>
            <span className="text-white font-bold text-sm min-w-[3ch]">{Math.ceil(health)}</span>
          </div>

          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-lg border border-white/10 w-64 shadow-xl">
            <Zap className="text-yellow-400 fill-yellow-400" size={24} />
            <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-300"
                style={{ width: `${fuel}%` }}
              />
            </div>
            <span className="text-white font-bold text-sm min-w-[3ch]">{Math.ceil(fuel)}</span>
          </div>
        </div>

        {/* Right Stats: Ammo & Score */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-xl">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Active Weapon</p>
              <p className="text-white font-bold text-lg leading-tight uppercase">Assault Rifle</p>
            </div>
            <div className="w-px h-8 bg-white/20 mx-2" />
            <div className="flex flex-col items-center">
               <Crosshair className="text-blue-400" size={20} />
               <span className="text-white font-mono text-xl font-bold">{ammo}/∞</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-500" size={18} />
              <span className="text-white font-bold uppercase tracking-wider">KILLS: {kills}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MiniMap Mockup */}
      <div className="absolute bottom-6 right-6 w-40 h-40 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden pointer-events-none shadow-2xl">
         <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:20px_20px]" />
         <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#22c55e]" />
      </div>

      {/* Mobile Controls Mockup Overlay (Visible only on touch) */}
      <div className="absolute bottom-8 left-8 flex gap-4 md:hidden pointer-events-none">
         <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-12 h-12 bg-white/30 rounded-full" />
         </div>
      </div>
      
      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-4 md:hidden pointer-events-none">
         <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-12 h-12 bg-white/30 rounded-full" />
         </div>
         <div className="w-16 h-16 bg-red-500/30 backdrop-blur-md rounded-full border border-red-500/50 flex items-center justify-center">
            <Zap className="text-white" size={24} />
         </div>
      </div>

      {/* Top Center: Room Info */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 shadow-xl flex items-center gap-4 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-white/60 text-xs font-medium tracking-widest uppercase">Room: Lobby-1</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <span className="text-white/80 text-xs font-bold uppercase">Map: Outpost-X</span>
      </div>

      {/* Intro Overlay */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 pointer-events-auto transition-opacity duration-1000 animate-in fade-out fill-mode-forwards delay-[4000ms]">
        <h1 className="text-7xl font-black text-white italic tracking-tighter uppercase mb-2">
          Outpost <span className="text-blue-500">Arena</span>
        </h1>
        <p className="text-blue-400/60 font-mono tracking-[0.3em] uppercase text-sm mb-12">Tactical Multiplayer Combat</p>
        
        <div className="grid grid-cols-2 gap-8 mb-12 text-white/80">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Movement</span>
            <div className="flex gap-2 font-mono text-sm">
              <span className="px-3 py-1 bg-white/10 rounded border border-white/20">WASD / ARROWS</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Jetpack</span>
            <div className="flex gap-2 font-mono text-sm">
              <span className="px-3 py-1 bg-white/10 rounded border border-white/20">SPACE (Hold)</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 col-span-2">
            <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Combat</span>
            <div className="flex gap-2 font-mono text-sm">
              <span className="px-3 py-1 bg-white/10 rounded border border-white/20">LEFT MOUSE / TOUCH - SHOOT</span>
            </div>
          </div>
        </div>

        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
           <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]" />
        </div>
      </div>
      
      <style>{`
        @keyframes loading {
          0% { width: 0; transform: translateX(0); }
          50% { width: 100%; transform: translateX(0); }
          100% { width: 0; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default App;
