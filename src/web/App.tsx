import { useEffect } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import {
  StartScreen,
  MathGame,
  MathResultScreen,
  DalgonaGame,
  DalgonaResultScreen,
  RedLightGame,
  RedLightResultScreen
} from '@web/components/screens';

export function App() {
  const { screen, startDalgona, startRedLight, startMathGame } = useGameStore();

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
    }
  }, [startDalgona, startRedLight, startMathGame]);

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
      default:
        return <StartScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white">
      {renderScreen()}
    </div>
  );
}
