import { useState, useEffect, type FormEvent } from 'react';
import { cardsApi } from '../api';

interface TranslateModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialWord?: string;
}

export const TranslateModal = ({ isOpen, onClose, initialWord = '' }: TranslateModalProps) => {
    const [word, setWord] = useState(initialWord);
    const [translations, setTranslations] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (initialWord && isOpen) {
            handleTranslate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialWord, isOpen]);

    const handleTranslate = async () => {
        if (!word.trim()) return;

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const result = await cardsApi.createCards(word.trim());
            setTranslations(Array.from(result));
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to translate word');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        handleTranslate();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Quick Translate</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={word}
                            onChange={(e) => setWord(e.target.value)}
                            placeholder="Enter word..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading || !word.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '...' : 'Translate'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                        {error}
                    </div>
                )}

                {success && translations.length > 0 && (
                    <div>
                        <div className="bg-green-50 text-green-600 p-2 rounded-md text-sm mb-3">
                            ✓ Added to collection
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Translations:</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {translations.map((translation, idx) => (
                                    <li key={idx} className="text-gray-700">{translation}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                    Close
                </button>
            </div>
        </div>
    );
};
