import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CentralContainer } from '../components/CentralContainer';
import { apiClient } from '../api/client';
import { IncreaseLimitsModal } from '../components/IncreaseLimitsModal';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showIncreaseLimitsModal, setShowIncreaseLimitsModal] = useState(false);

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/backup/export', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flips_backup.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export backup');
    }
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/backup/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult(response.data);
    } catch (error: any) {
      console.error('Failed to import:', error);
      setImportResult({ error: error.response?.data?.detail || 'Failed to import' });
    } finally {
      setImporting(false);
    }
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

        <h2 className="text-2xl font-bold mb-6">Settings</h2>

        <div className="space-y-6">
          {/* Backup Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Backup</h3>

            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Download Backup
              </button>

              <div>
                <label className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer block text-center">
                  {importing ? 'Uploading...' : 'Upload Backup'}
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImport}
                    disabled={importing}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {importResult && (
              <div className={`mt-4 p-4 rounded-md ${importResult.error ? 'bg-red-50' : 'bg-green-50'}`}>
                {importResult.error ? (
                  <p className="text-red-700">{importResult.error}</p>
                ) : (
                  <div>
                    <p className="font-semibold text-green-700 mb-2">Import successful!</p>
                    <p className="text-sm text-green-600">
                      Cards added: {importResult.cards_added || 0},
                      updated: {importResult.cards_updated || 0}
                    </p>
                    <p className="text-sm text-green-600">
                      Schedules added: {importResult.schedules_added || 0},
                      updated: {importResult.schedules_updated || 0}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Limits Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Limits</h3>

            <div className="space-y-3">
              <button
                onClick={() => setShowIncreaseLimitsModal(true)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Increase Limits
              </button>
            </div>
          </div>
        </div>
      </div>

      <IncreaseLimitsModal
        isOpen={showIncreaseLimitsModal}
        onClose={() => setShowIncreaseLimitsModal(false)}
      />
    </CentralContainer>
  );
};

