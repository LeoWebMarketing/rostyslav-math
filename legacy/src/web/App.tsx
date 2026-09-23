import { useEffect } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import {
  StartScreen,
  MathGame,
  MathResultScreen,
  DalgonaGame,
  DalgonaResultScreen,
  RedLightGame,
  RedLightResultScreen,
  GlassBridgeGame,
  GlassBridgeResultScreen,
  TugOfWarGame,
  TugOfWarResultScreen,
  MarblesGame,
  MarblesResultScreen,
  ZumaGame,
  ZumaResultScreen
} from '@web/components/screens';

export function App() {
  const { screen, startDalgona, startRedLight, startMathGame, startGlassBridge, startTugOfWar, startMarbles, startZuma } = useGameStore();

  // Secret URL params for direct game access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const game = params.get('game');

    if (game === 'dalgona') {
      startDalgona();
    } else if (game === 'redlight' || game === 'red') {
      startRedLight();
    } else if (game === 'math') {
      startMathGame();
    } else if (game === 'glass' || game === 'bridge') {
      startGlassBridge();
    } else if (game === 'tug' || game === 'tugofwar') {
      startTugOfWar();
    } else if (game === 'marbles') {
      startMarbles();
    } else if (game === 'zuma') {
      startZuma();
    }
  }, [startDalgona, startRedLight, startMathGame, startGlassBridge, startTugOfWar, startMarbles, startZuma]);

  const renderScreen = () => {
    switch (screen) {
      case 'start':
        return <StartScreen />;
      case 'math':
        return <MathGame />;
      case 'mathResult':
        return <MathResultScreen />;
      case 'dalgona':
        return <DalgonaGame />;
      case 'dalgonaResult':
        return <DalgonaResultScreen />;
      case 'redLight':
        return <RedLightGame />;
      case 'redLightResult':
        return <RedLightResultScreen />;
      case 'glassBridge':
        return <GlassBridgeGame />;
      case 'glassBridgeResult':
        return <GlassBridgeResultScreen />;
      case 'tugOfWar':
        return <TugOfWarGame />;
      case 'tugOfWarResult':
        return <TugOfWarResultScreen />;
      case 'marbles':
        return <MarblesGame />;
      case 'marblesResult':
        return <MarblesResultScreen />;
      case 'zuma':
        return <ZumaGame />;
      case 'zumaResult':
        return <ZumaResultScreen />;
      default:
        return <StartScreen />;
    }
  };

  return (
    <div className="h-screen h-[100dvh] bg-dark text-white overflow-clip">
      {renderScreen()}
    </div>
  );
}
