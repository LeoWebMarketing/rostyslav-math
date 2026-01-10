import { useGameStore } from '@core/stores/gameStore';
import {
  StartScreen,
  MathGame,
  MathResultScreen,
  DalgonaGame,
  DalgonaResultScreen
} from '@web/components/screens';

export function App() {
  const { screen } = useGameStore();

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
