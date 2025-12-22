import { useState, type FormEvent } from 'react';
import { cardsApi } from '../api';

interface TranslationMessage {
  word: string;
  translations: string[];
  timestamp: number;
}

export const FloatingTranslateChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [word, setWord] = useState('');
  const [messages, setMessages] = useState<TranslationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!word.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const result = await cardsApi.createCards(word.trim());
      setMessages([
        ...messages,
        {
          word: word.trim(),
          translations: Array.from(result),
          timestamp: Date.now(),
        },
      ]);
      setWord('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to translate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center text-2xl z-50 transition-transform hover:scale-110"
        aria-label="Translate"
      >
        💬
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-80 bg-white rounded-lg shadow-2xl z-50 flex flex-col md:flex-col"
          style={{
            maxWidth: 'calc(100vw - 3rem)',
            maxHeight: 'calc(100vh - 8rem)',
            height: '500px',
          }}
        >
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center flex-shrink-0">
            <span className="font-semibold">Quick Translate</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-xl"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-gray-400 text-center mt-8">
                Type a word to translate
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-1">
                <div className="bg-blue-100 rounded-lg p-2 text-right">
                  <div className="font-semibold">{msg.word}</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-2">
                  <div className="space-y-1">
                    {msg.translations.map((trans, i) => (
                      <div key={i}>• {trans}</div>
                    ))}
                  </div>
                  <div className="text-green-600 mt-1">✓ Added to collection</div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t p-3 flex-shrink-0">
            {error && (
              <div className="text-red-600 mb-2">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Enter word..."
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                enterKeyHint="go"
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !word.trim()}
                className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '...' : '→'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
