import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { assessmentsAPI, usersAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Assessment {
  id: string;
  overall_score?: number;
  created_at: string;
  assessed_at?: string;
}

export default function ReportsExportPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    if (!user?.org_id) return;

    try {
      const userResponse = await usersAPI.getMe();
      const orgId = userResponse.data.org_id;
      const response = await assessmentsAPI.list(orgId);
      const finalized = response.data.filter((a: Assessment) => a.overall_score);
      setAssessments(finalized);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      const response = await assessmentsAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assessment-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Napaka pri prenosu PDF');
    }
  };

  const handleDownloadCSV = async (id: string) => {
    try {
      const response = await assessmentsAPI.downloadCSV(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assessment-${id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download CSV:', error);
      alert('Napaka pri prenosu CSV');
    }
  };

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">PDF Export</h1>
            <p className="text-muted-foreground">
              Prenesite poročila vaših ocen v PDF ali CSV formatu
            </p>
          </div>

          {loading ? (
            <p>Nalaganje...</p>
          ) : assessments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Nimate še nobene zaključene ocene za export.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <Card key={assessment.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Ocena {assessment.id.slice(0, 8)} - {assessment.overall_score?.toFixed(1)} / 5.0
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(assessment.created_at).toLocaleDateString('sl-SI')}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleDownloadPDF(assessment.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Prenesi PDF
                      </Button>
                      <Button 
                        onClick={() => handleDownloadCSV(assessment.id)}
                        variant="outline"
                      >
                        Prenesi CSV
                      </Button>
                      <Button 
                        onClick={() => navigate(`/assessments/${assessment.id}`)}
                        variant="outline"
                      >
                        Preglej
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8">
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              ← Nazaj
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
