/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { GameHUD } from './components/hud/GameHUD';
import { ExtractionModal } from './components/modals/ExtractionModal';
import { ForgeModal } from './components/modals/ForgeModal';
import { RunBagModal } from './components/modals/RunBagModal';
import { StashModal } from './components/modals/StashModal';
import { TitleAndStatusModals } from './components/modals/TitleAndStatusModals';
import { GameEngine } from './engine/GameEngine';
import { useGameStore } from './store/useGameStore';

export default function App() {
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const activeStationModal = useGameStore((s) => s.activeStationModal);
  const shellState = useGameStore((s) => s.shellState);

  useEffect(() => {
    document.body.dataset.state = shellState;
  }, [shellState]);

  useEffect(() => {
    const container = canvasHostRef.current;
    if (!container) return;

    const engine = new GameEngine(container);
    engine.init();

    return () => {
      engine.destroy();
    };
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0b0c10] select-none">
      {/* Isolated PixiJS v8 Viewport */}
      <div
        ref={canvasHostRef}
        data-testid="pixi-game-canvas"
        className="fixed inset-0 w-full h-full z-0"
      />

      {/* World-Matched HUD Overlay */}
      <GameHUD />

      {/* Station, Run Bag & Extraction Modals */}
      {activeStationModal === 'stash' && <StashModal />}
      {activeStationModal === 'forge' && <ForgeModal />}
      {activeStationModal === 'extraction' && <ExtractionModal />}
      {activeStationModal === 'runbag' && <RunBagModal />}

      {/* Title, Pause & End-of-Run Summary Modals */}
      <TitleAndStatusModals />
    </main>
  );
}
