import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CentralContainer } from '../components/CentralContainer';
import { cardsApi } from '../api';

interface BulkCreateResponse {
    added: string[];
    failed: string[];
}

export const AddPage = () => {
    const navigate = useNavigate();
    const [words, setWords] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<BulkCreateResponse | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0, stage: 'idle' as 'idle' | 'preparing' | 'processing' });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const wordList = words
            .split('\n')
            .map(w => w.trim())
            .filter(w => w.length > 0);

        if (wordList.length === 0) return;

        setLoading(true);
        setResult(null);
        setProgress({ current: 0, total: wordList.length, stage: 'preparing' });

        // Даем React время обновить UI
        await new Promise(resolve => setTimeout(resolve, 50));

        // Получаем уникальные значения
        const uniqueWords = Array.from(new Set(wordList));
        setProgress({ current: 0, total: uniqueWords.length, stage: 'processing' });

        // Даем React время обновить UI
        await new Promise(resolve => setTimeout(resolve, 50));

        const added: string[] = [];
        const failed: string[] = [];

        // Обрабатываем слова по одному для показа прогресса
        for (let i = 0; i < uniqueWords.length; i++) {
            setProgress({ current: i + 1, total: uniqueWords.length, stage: 'processing' });

            try {
                await cardsApi.createCards(uniqueWords[i]);
                added.push(uniqueWords[i]);
            } catch (error) {
                failed.push(uniqueWords[i]);
            }

            // Даем React время обновить UI каждые 10 слов
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        setResult({ added, failed });
        setLoading(false);
        setProgress({ current: 0, total: 0, stage: 'idle' });
    };

    return (
        <CentralContainer>
            <div className="bg-white md:bg-white bg-transparent rounded-lg md:rounded-lg md:shadow-md p-4 md:p-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mb-4 text-gray-600 hover:text-gray-800 flex items-center"
                >
                    ← Menu
                </button>

                <h2 className="text-2xl font-bold mb-4">Add Words</h2>

                <form onSubmit={handleSubmit} className="mb-6">
                    <textarea
                        value={words}
                        onChange={(e) => setWords(e.target.value)}
                        placeholder="Enter words, one per line..."
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                        className="w-full h-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        disabled={loading}
                    />

                    {loading && (
                        <div className="mb-4">
                            {progress.stage === 'preparing' && (
                                <div className="text-gray-600">Preparing unique words...</div>
                            )}
                            {progress.stage === 'processing' && (
                                <div className="text-gray-600">
                                    Processing: {progress.current}/{progress.total} unique words
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !words.trim()}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Adding...' : 'Add Words'}
                    </button>
                </form>

                {result && (
                    <div className="space-y-4">
                        {result.added.length > 0 && (
                            <div className="bg-green-50 p-4 rounded-md">
                                <h3 className="font-semibold text-green-700">
                                    Successfully added: {result.added.length} words
                                </h3>
                            </div>
                        )}

                        {result.failed.length > 0 && (
                            <div className="bg-red-50 p-4 rounded-md">
                                <h3 className="font-semibold text-red-700 mb-2">
                                    Failed: {result.failed.length}
                                </h3>
                                <div className="text-sm text-red-600">
                                    {result.failed.join(', ')}
                                </div>
                            </div>
                        )}

                        {result.failed.length === 0 && result.added.length > 0 && (
                            <div className="text-green-600 text-center">
                                All words added successfully!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </CentralContainer>
    );
};
