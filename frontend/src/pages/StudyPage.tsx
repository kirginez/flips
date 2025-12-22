import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CentralContainer } from '../components/CentralContainer';
import { FloatingTranslateChat } from '../components/FloatingTranslateChat';
import { IncreaseLimitsModal } from '../components/IncreaseLimitsModal';
import { studyApi } from '../api';
import type { Card } from '../types';
import { compareWords, isWordCorrect, getCorrectWithMissing } from '../utils/wordComparison';

type Stage = 'definition' | 'with_translation' | 'incorrect' | 'must_type' | 'final';

export const StudyPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>('definition');
  const [input, setInput] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showIncreaseLimitsModal, setShowIncreaseLimitsModal] = useState(false);

  useEffect(() => {
    loadNextCard();
  }, []);

  useEffect(() => {
    if (stage === 'final' && continueButtonRef.current) {
      continueButtonRef.current.focus();
    } else if (inputRef.current && stage !== 'final') {
      inputRef.current.focus();
    }
  }, [stage, card]);

  const loadNextCard = async () => {
    setLoading(true);
    try {
      const nextCard = await studyApi.getNextCard();
      if (nextCard) {
        setCard(nextCard);
        setStage('definition');
        setInput('');
        setUserAnswer('');
        setShowTranslation(false);
        setWasCorrect(false);
        setShowDeleteConfirm(false);
      } else {
        setCard(null);
      }
    } catch (error) {
      console.error('Failed to load card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleAnswer();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (stage === 'final' && e.key === 'Enter') {
      handleContinue();
    }
  };

  const handleAnswer = () => {
    if (!card) return;

    const trimmedInput = input.trim();

    if (!trimmedInput) {
      if (stage === 'definition') {
        setShowTranslation(true);
        setStage('with_translation');
      } else if (stage === 'with_translation') {
        setShowTranslation(true);
        setStage('must_type');
      }
      return;
    }

    const correct = isWordCorrect(trimmedInput, card.word);
    setUserAnswer(trimmedInput);

    if (correct) {
      setShowTranslation(true);
      if (stage === 'must_type') {
        setStage('final');
        setWasCorrect(false);
      } else {
        setStage('final');
        setWasCorrect(true);
      }
    } else {
      setShowTranslation(true);
      setStage('incorrect');
    }

    setInput('');
  };

  const handleContinue = async () => {
    if (!card) return;
    await sendAnswer(wasCorrect);
    loadNextCard();
  };

  const handleManualOverride = async (overrideCorrect: boolean) => {
    if (!card) return;
    await sendAnswer(overrideCorrect);
    loadNextCard();
  };

  const handleDelete = async () => {
    if (!card) return;
    try {
      await studyApi.deleteCard(card.id);
      loadNextCard();
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  const sendAnswer = async (isCorrect: boolean) => {
    if (!card) return;
    try {
      await studyApi.answerCard({ card_id: card.id, answer: isCorrect });
    } catch (error) {
      console.error('Failed to send answer:', error);
    }
  };

  if (loading) {
    return (
      <CentralContainer>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </CentralContainer>
    );
  }

  if (!card) {
    return (
      <CentralContainer>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No cards available</h2>
          <p className="text-gray-600 mb-6">You've completed all cards for today!</p>
          <div className="space-y-3">
            <button
              onClick={() => setShowIncreaseLimitsModal(true)}
              className="w-full px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add more cards
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        <IncreaseLimitsModal
          isOpen={showIncreaseLimitsModal}
          onClose={() => setShowIncreaseLimitsModal(false)}
          onSuccess={() => {
            loadNextCard();
          }}
        />
      </CentralContainer>
    );
  }

  return (
    <>
      <CentralContainer>
        <div className="bg-white md:bg-white bg-transparent rounded-lg md:rounded-lg md:shadow-md p-4 md:p-8 max-w-xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-2 text-gray-600 hover:text-gray-800 flex items-center"
          >
            ← Menu
          </button>

          {card.meta && <div className="text-gray-500 italic leading-tight mb-1">{card.meta}</div>}
          <div className="leading-tight mb-1">{card.definition || 'No definition'}</div>

          {showTranslation && (
            <div className="leading-tight mb-1">{card.translation}</div>
          )}

          {stage === 'incorrect' && (
            <>
              <div className="leading-tight mb-1 font-mono">
                {compareWords(userAnswer, card.word).map((char, idx) => (
                  <span
                    key={idx}
                    className={
                      char.isCorrect
                        ? 'bg-green-200'
                        : 'bg-red-200'
                    }
                  >
                    {char.char}
                  </span>
                ))}
              </div>

              <div className="leading-tight mb-1 font-mono">
                {getCorrectWithMissing(userAnswer, card.word).map((char, idx) => (
                  <span
                    key={idx}
                    className={
                      char.isCorrect
                        ? 'bg-green-200'
                        : char.isReplaced
                          ? 'bg-gray-200'
                          : 'bg-red-200'
                    }
                  >
                    {char.char}
                  </span>
                ))}
              </div>

              {card.pronunciation && (
                <div className="italic leading-tight mb-1">{card.pronunciation}</div>
              )}
              {card.example && (
                <div className="text-left leading-tight mb-1">{card.example}</div>
              )}
              {card.example_translation && (
                <div className="text-left leading-tight mb-1">{card.example_translation}</div>
              )}
            </>
          )}

          {stage === 'must_type' && (
            <>
              <div className="font-bold leading-tight mb-1">{card.word}</div>
              {card.pronunciation && (
                <div className="italic leading-tight mb-1">{card.pronunciation}</div>
              )}
              {card.example && (
                <div className="text-left leading-tight mb-1">{card.example}</div>
              )}
              {card.example_translation && (
                <div className="text-left leading-tight mb-1">{card.example_translation}</div>
              )}
            </>
          )}

          {stage === 'final' && (
            <>
              <div className="font-bold leading-tight mb-1">
                {card.word} {wasCorrect && <span className="text-green-600">✓</span>}
              </div>
              {card.pronunciation && (
                <div className="italic leading-tight mb-1">{card.pronunciation}</div>
              )}
              {card.example && (
                <div className="text-left leading-tight mb-1">{card.example}</div>
              )}
              {card.example_translation && (
                <div className="text-left leading-tight mb-1">{card.example_translation}</div>
              )}
            </>
          )}

          {stage !== 'final' && (
            <>
              <form onSubmit={handleSubmit} className="mt-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.keyCode === 13) {
                      e.preventDefault();
                      handleAnswer();
                    }
                  }}
                  placeholder="Type word..."
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  enterKeyHint="go"
                  inputMode="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </form>

              {stage === 'incorrect' && (
                <button
                  onClick={() => handleManualOverride(true)}
                  className="w-full mt-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Actually correct
                </button>
              )}
            </>
          )}

          {stage === 'final' && (
            <div className="mt-2 space-y-1">
              <button
                ref={continueButtonRef}
                onClick={handleContinue}
                onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Continue
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Delete card
              </button>
            </div>
          )}

          {/* Confirmation dialog */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                <h3 className="text-lg font-bold mb-4">Delete card?</h3>
                <p className="text-gray-600 mb-4">Are you sure you want to delete this card?</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CentralContainer>

      <FloatingTranslateChat />
    </>
  );
};
