import { useState, useEffect, useRef, useCallback } from 'react';
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
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const isSubmittingRef = useRef(false);
  const submittingCardIdRef = useRef<string | null>(null);

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>('definition');
  const [input, setInput] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showIncreaseLimitsModal, setShowIncreaseLimitsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Загрузка следующей карточки
  const loadNextCard = useCallback(async () => {
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
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      submittingCardIdRef.current = null;
    }
  }, []);

  // Отправка ответа на сервер
  const sendAnswer = useCallback(async (isCorrect: boolean, cardId: string) => {
    const timestamp = new Date().toISOString();
    console.log(`📤 [${timestamp}] Sending answer:`, { answer: isCorrect, cardId });
    try {
      const result = await studyApi.answerCard({ card_id: cardId, answer: isCorrect });
      console.log(`✅ [${new Date().toISOString()}] Answer sent successfully`);
      return result;
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Failed to send answer:`, error);
      throw error;
    }
  }, []);

  // Обработка ответа пользователя
  const handleAnswer = () => {
    if (!card) return;

    // Защита от повторной обработки
    if (isSubmitting || isSubmittingRef.current || stage === 'final') {
      return;
    }

    const trimmedInput = input.trim();

    // Обработка пустого поля
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

    // Проверка правильности ответа
    const correct = isWordCorrect(trimmedInput, card.word);
    setUserAnswer(trimmedInput);

    if (correct) {
      setShowTranslation(true);
      // Если дошли до стадии must_type, значит пользователь уже пропустил ответ дважды
      // Поэтому даже правильный ответ на этой стадии считается неправильным
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
      setWasCorrect(false);
    }

    setInput('');
  };

  // Продолжить - отправить ответ и загрузить следующую карточку
  const handleContinue = useCallback(async () => {
    const timestamp = new Date().toISOString();
    const stackTrace = new Error().stack;

    console.group(`🔵 handleContinue called at ${timestamp}`);
    console.log('Stack trace:', stackTrace);
    console.log('Card:', card?.id);
    console.log('isSubmittingRef.current:', isSubmittingRef.current);
    console.log('submittingCardIdRef.current:', submittingCardIdRef.current);

    // Строгая защита от двойного вызова через ref
    if (!card || isSubmittingRef.current) {
      console.warn('❌ BLOCKED: card:', !!card, 'isSubmitting:', isSubmittingRef.current);
      console.groupEnd();
      return;
    }

    // Проверяем, не отправляется ли уже запрос для этой карточки
    if (submittingCardIdRef.current === card.id) {
      console.warn('❌ BLOCKED: already submitting for card:', card.id);
      console.groupEnd();
      return;
    }

    console.log('✅ PROCEEDING: starting for card:', card.id);

    // Сохраняем ID карточки ДО установки флагов
    const currentCardId = card.id;
    const currentWasCorrect = wasCorrect;

    // Устанавливаем флаги синхронно ПЕРЕД любыми другими операциями
    isSubmittingRef.current = true;
    submittingCardIdRef.current = currentCardId;
    setIsSubmitting(true);

    // Очищаем карточку для показа загрузки
    setCard(null);
    setLoading(true);
    setStage('definition');

    try {
      // Отправляем ответ
      console.log('handleContinue: sending answer for card:', currentCardId);
      await sendAnswer(currentWasCorrect, currentCardId);

      // Небольшая задержка для обновления расписания на сервере
      await new Promise(resolve => setTimeout(resolve, 100));

      // Загружаем следующую карточку
      // Если вернулась та же карточка, пробуем еще раз
      let attempts = 0;
      let nextCard = null;
      while (attempts < 5) {
        console.log('handleContinue: loading next card, attempt:', attempts + 1);
        nextCard = await studyApi.getNextCard();
        if (!nextCard || nextCard.id !== currentCardId) {
          break;
        }
        console.log('handleContinue: same card returned, retrying...');
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }

      if (nextCard && nextCard.id !== currentCardId) {
        console.log('handleContinue: loaded new card:', nextCard.id);
        setCard(nextCard);
        setStage('definition');
        setInput('');
        setUserAnswer('');
        setShowTranslation(false);
        setWasCorrect(false);
        setShowDeleteConfirm(false);
      } else {
        console.log('handleContinue: no more cards');
        setCard(null);
      }
    } catch (error) {
      console.error('❌ Failed to continue:', error);
    } finally {
      console.log('✅ handleContinue: finished');
      console.groupEnd();
      setLoading(false);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      submittingCardIdRef.current = null;
    }
  }, [card, wasCorrect, sendAnswer]);

  // Ручное переопределение правильности ответа
  const handleManualOverride = useCallback(async (overrideCorrect: boolean) => {
    if (!card || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      await sendAnswer(overrideCorrect, card.id);
      await loadNextCard();
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [card, sendAnswer, loadNextCard]);

  // Удаление карточки
  const handleDelete = useCallback(async () => {
    if (!card || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      await studyApi.deleteCard(card.id);
      await loadNextCard();
    } catch (error) {
      console.error('Failed to delete card:', error);
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [card, loadNextCard]);


  // Загрузка первой карточки при монтировании
  useEffect(() => {
    loadNextCard();
  }, [loadNextCard]);

  // Автофокус на инпут или кнопку Continue
  useEffect(() => {
    if (stage === 'final' && continueButtonRef.current) {
      continueButtonRef.current.focus();
    } else if (inputRef.current && stage !== 'final') {
      inputRef.current.focus();
    }
  }, [stage, card]);

  // Состояние загрузки
  if (loading && !card) {
    return (
      <CentralContainer>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </CentralContainer>
    );
  }

  // Нет карточек
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

          {/* Мета информация */}
          {card.meta && <div className="text-gray-500 italic leading-tight mb-1">{card.meta}</div>}

          {/* Определение */}
          <div className="leading-tight mb-1">{card.definition || 'No definition'}</div>

          {/* Перевод */}
          {showTranslation && (
            <div className="leading-tight mb-1">{card.translation}</div>
          )}

          {/* Неправильный ответ - показываем сравнение */}
          {stage === 'incorrect' && (
            <>
              <div className="leading-tight mb-1 font-mono">
                {compareWords(userAnswer, card.word).map((char, idx) => (
                  <span
                    key={idx}
                    className={char.isCorrect ? 'bg-green-200' : 'bg-red-200'}
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

          {/* Стадия must_type - показываем слово */}
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

          {/* Финальная стадия */}
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

          {/* Форма ввода (не на финальной стадии) */}
          {stage !== 'final' && (
            <>
              <div className="mt-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type word..."
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <button
                  ref={submitButtonRef}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isSubmitting && !isSubmittingRef.current) {
                      handleAnswer();
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full mt-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </div>

              {/* Кнопка "Actually correct" при неправильном ответе */}
              {stage === 'incorrect' && (
                <button
                  onClick={() => handleManualOverride(true)}
                  disabled={isSubmitting}
                  className="w-full mt-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Actually correct
                </button>
              )}
            </>
          )}

          {/* Кнопки на финальной стадии */}
          {stage === 'final' && (
            <div className="mt-2 space-y-1">
              <button
                ref={continueButtonRef}
                type="button"
                onClick={(e) => {
                  const timestamp = new Date().toISOString();
                  console.log(`🖱️ [${timestamp}] Button clicked`);
                  console.log('Event:', e);
                  console.log('Event type:', e.type);
                  console.log('isSubmitting:', isSubmitting);
                  console.log('isSubmittingRef.current:', isSubmittingRef.current);

                  e.preventDefault();
                  e.stopPropagation();

                  console.log('Calling handleContinue...');
                  handleContinue();
                }}
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Loading...' : 'Continue'}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
                className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete card
              </button>
            </div>
          )}

          {/* Диалог подтверждения удаления */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                <h3 className="text-lg font-bold mb-4">Delete card?</h3>
                <p className="text-gray-600 mb-4">Are you sure you want to delete this card?</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
