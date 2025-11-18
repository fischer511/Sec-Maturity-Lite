import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { assessmentsAPI, importsAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Assessment {
  id: string;
  overall_score?: number;
  created_at: string;
  assessed_at?: string;
}

interface ImportHistory {
  id: string;
  assessment_id?: string;
  filename: string;
  status: string;
  rows_processed: number;
  rows_created: number;
  rows_updated: number;
  error_message?: string;
  created_at: string;
}

export default function ImportsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.org_id) return;

    try {
      // Load assessments
      const assessmentsRes = await assessmentsAPI.list(user.org_id);
      setAssessments(assessmentsRes.data);

      // Load import history
      const historyRes = await importsAPI.getHistory(user.org_id);
      setImportHistory(historyRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedAssessment) {
      alert('Prosim, izberi oceno in datoteko.');
      return;
    }

    try {
      setUploading(true);
      setImportResult(null);

      const response = await importsAPI.uploadCSV(selectedAssessment, file);
      setImportResult(response.data);

      // Reload history
      await loadData();

      // Reset form
      setFile(null);
      setSelectedAssessment('');
      
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error('Upload failed:', error);
      setImportResult({
        status: 'error',
        error_message: error.response?.data?.detail || 'Napaka pri uvozu CSV',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Sec-Maturity-Lite</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Nazaj
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">CSV Uvoz Ocen</h2>

        {/* Upload Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Uvozi CSV datoteko</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Assessment Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Izberi oceno za uvoz
                </label>
                <select
                  value={selectedAssessment}
                  onChange={(e) => setSelectedAssessment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Izberi oceno --</option>
                  {assessments.map((assessment) => {
                    const date = assessment.created_at ? new Date(assessment.created_at) : null;
                    const dateStr = date && !isNaN(date.getTime()) 
                      ? date.toLocaleDateString('sl-SI')
                      : 'Neznan datum';
                    const status = assessment.overall_score ? 'Zaključena' : 'Osnutek';
                    
                    return (
                      <option key={assessment.id} value={assessment.id}>
                        {status} | Ocena {assessment.id.slice(0, 8)} | {dateStr}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Izberi CSV datoteko
                </label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                {file && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Izbrana datoteka: {file.name}
                  </p>
                )}
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!file || !selectedAssessment || uploading}
                className="w-full"
              >
                {uploading ? 'Uvažam...' : 'Uvozi CSV'}
              </Button>
              
              {/* Link to selected assessment */}
              {selectedAssessment && !importResult && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/assessments/${selectedAssessment}`)}
                    className="w-full"
                  >
                    Preglej izbrano oceno
                  </Button>
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div
                  className={`p-4 rounded-md ${
                    importResult.status === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {importResult.status === 'success' ? (
                    <div>
                      <h4 className="font-semibold text-green-800 mb-2">Uvoz uspešen!</h4>
                      <ul className="text-sm text-green-700 space-y-1 mb-3">
                        <li>Obdelanih vrstic: {importResult.rows_processed}</li>
                        <li>Ustvarjenih odgovorov: {importResult.rows_created}</li>
                        <li>Posodobljenih odgovorov: {importResult.rows_updated}</li>
                      </ul>
                      <Button
                        onClick={() => navigate(`/assessments/${selectedAssessment}`)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Preglej oceno in zaključi →
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-red-800 mb-2">✗ Napaka pri uvozu</h4>
                      <p className="text-sm text-red-700">{importResult.error_message}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Import History */}
        <Card>
          <CardHeader>
            <CardTitle>Zgodovina uvozov</CardTitle>
          </CardHeader>
          <CardContent>
            {importHistory.length === 0 ? (
              <p className="text-muted-foreground">Ni zgodovine uvozov.</p>
            ) : (
              <div className="space-y-3">
                {importHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{item.filename || 'Neznana datoteka'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleString('sl-SI')}
                        </p>
                        {item.status === 'success' && (
                          <p className="text-xs text-green-600 mt-1">
                            {item.rows_processed} obdelanih, {item.rows_created} ustvarjenih, {item.rows_updated} posodobljenih
                          </p>
                        )}
                        {item.status === 'error' && item.error_message && (
                          <p className="text-xs text-red-600 mt-1">Napaka: {item.error_message}</p>
                        )}
                      </div>
                      <span
                        className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          item.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.status === 'success' ? 'Uspešno' : item.status === 'error' ? 'Napaka' : 'V teku'}
                      </span>
                    </div>
                    {item.assessment_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/assessments/${item.assessment_id}`)}
                        className="mt-2 w-full"
                      >
                        Preglej oceno →
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
