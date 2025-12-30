import { useState, type FormEvent } from 'react';
import { studyApi } from '../api';

interface IncreaseLimitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const IncreaseLimitsModal = ({ isOpen, onClose, onSuccess }: IncreaseLimitsModalProps) => {
  const [amount, setAmount] = useState('');
  const [limitType, setLimitType] = useState<'NEW' | 'DUE'>('NEW');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await studyApi.increaseLimit(limitType, numAmount);
      setSuccess(true);
      setAmount('');

      // Закрываем модальное окно через небольшую задержку и вызываем onSuccess
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to increase limit');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 w-full">
        <h3 className="text-lg font-bold mb-4">Increase Limits</h3>

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
            Successfully increased {limitType} limit by {amount} cards!
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of cards
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading || success}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter number"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Limit type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="limitType"
                  value="NEW"
                  checked={limitType === 'NEW'}
                  onChange={(e) => setLimitType(e.target.value as 'NEW' | 'DUE')}
                  disabled={loading || success}
                  className="mr-2"
                />
                <span>New cards (NEW)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="limitType"
                  value="DUE"
                  checked={limitType === 'DUE'}
                  onChange={(e) => setLimitType(e.target.value as 'NEW' | 'DUE')}
                  disabled={loading || success}
                  className="mr-2"
                />
                <span>Due cards (DUE)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || success || !amount}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};






