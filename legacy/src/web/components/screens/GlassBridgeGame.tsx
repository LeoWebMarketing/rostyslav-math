import { useCallback, useEffect } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { getPanelsForRow, getProblemForRow, getBridgeProgress } from '@core/games/glassBridge/glassBridgeEngine';
import { vibrateWrong, vibrateFail, vibrateSuccess, vibrateCorrect } from '@core/utils/vibration';

export function GlassBridgeGame() {
  const {
    glassBridge,
    glassBridgeStep,
    restartGlassBridge,
    goToStart,
  } = useGameStore();

  const { panels, currentRow, totalRows, completed, failed, selectedPanel } = glassBridge;
  const progress = getBridgeProgress(glassBridge);

  // Get current problem (next row to step on)
  const currentProblem = currentRow < totalRows - 1 ? getProblemForRow(glassBridge, currentRow + 1) : null;

  // Vibration on game end
  useEffect(() => {
    if (completed) {
      vibrateSuccess();
    } else if (failed) {
      vibrateFail();
    }
  }, [completed, failed]);

  // Vibration on step
  useEffect(() => {
    if (selectedPanel !== null) {
      const panel = panels.find(p => p.id === selectedPanel);
      if (panel) {
        if (panel.isSafe) {
          vibrateCorrect();
        } else {
          vibrateWrong();
        }
      }
    }
  }, [selectedPanel, panels]);

  const handlePanelClick = useCallback((panelId: number) => {
    if (completed || failed) return;
    glassBridgeStep(panelId);
  }, [completed, failed, glassBridgeStep]);

  // Render each row of panels
  const renderRow = (rowIndex: number) => {
    const [leftPanel, rightPanel] = getPanelsForRow(glassBridge, rowIndex);
    const isCurrentRow = rowIndex === currentRow + 1;
    const isPastRow = rowIndex <= currentRow;
    const isFutureRow = rowIndex > currentRow + 1;

    return (
      <div
        key={rowIndex}
        className={`glass-row flex justify-center gap-4 mb-2 ${isCurrentRow ? 'current-row' : ''}`}
      >
        {[leftPanel, rightPanel].map((panel) => {
          let panelClass = 'glass-panel';

          if (panel.isBroken) {
            panelClass += ' broken';
          } else if (panel.isRevealed) {
            panelClass += panel.isSafe ? ' safe' : ' revealed';
          } else if (isCurrentRow) {
            panelClass += ' selectable';
          } else if (isPastRow) {
            panelClass += ' past';
          } else if (isFutureRow) {
            panelClass += ' future';
          }

          return (
            <button
              key={panel.id}
              className={panelClass}
              onClick={() => isCurrentRow && handlePanelClick(panel.id)}
              disabled={!isCurrentRow || completed || failed}
            >
              {panel.isBroken ? '💥' : panel.isRevealed && panel.isSafe ? '✓' :
                (isCurrentRow || isPastRow) ? panel.displayValue : '?'}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="screen-fade-in flex flex-col items-center flex-grow px-5 py-6 select-none">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-pink mb-1" style={{ textShadow: '0 0 15px rgba(255, 0, 128, 0.5)' }}>
          🌉 Скляний Міст
        </h2>
        <p className="text-teal">Обери правильну відповідь!</p>
      </div>

      {/* Current Problem */}
      {currentProblem && !completed && !failed && (
        <div className="problem-card mb-4 px-6 py-4 max-w-xs">
          <div className="text-3xl font-bold text-white text-center">
            {currentProblem.a} {currentProblem.op} {currentProblem.b} = ?
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="w-full max-w-xs mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Крок {Math.max(0, currentRow + 1)}</span>
          <span>з {totalRows}</span>
        </div>
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Bridge */}
      <div className="glass-bridge-container flex-grow flex flex-col justify-center w-full max-w-xs">
        {/* Finish platform */}
        <div className="finish-platform mb-4 text-center">
          <div className="text-3xl">🏁</div>
          <div className="text-teal text-sm">Фініш</div>
        </div>

        {/* Glass panels - rendered from top (finish) to bottom (start) */}
        <div className="glass-panels flex flex-col">
          {Array.from({ length: totalRows }, (_, i) => renderRow(totalRows - 1 - i))}
        </div>

        {/* Start platform */}
        <div className="start-platform mt-4 text-center">
          <div className="text-3xl">🧍</div>
          <div className="text-teal text-sm">Старт</div>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-center text-teal text-sm mb-4 bg-dark p-3 rounded-xl border border-gray max-w-xs">
        👆 Розвяжи приклад і натисни на панель з правильною відповіддю!
      </p>

      {/* Control Buttons */}
      <div className="flex gap-4 mt-auto">
        <button
          className="btn btn-secondary px-6 py-2 text-sm"
          onClick={() => restartGlassBridge()}
        >
          🔄 Заново
        </button>
        <button
          className="btn btn-next px-6 py-2 text-sm !animate-none"
          onClick={() => goToStart()}
        >
          ← Вийти
        </button>
      </div>
    </div>
  );
}
