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
  status?: string;
}

export default function MyAssessmentPage() {
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
      setAssessments(response.data);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Moja ocena</h1>
            <p className="text-muted-foreground">
              Vse moje ocene varnostne zrelosti
            </p>
          </div>

          {loading ? (
            <p>Nalaganje...</p>
          ) : assessments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">Nimate še nobene ocene.</p>
                <Button onClick={() => navigate('/assessments/new')}>
                  Ustvari prvo oceno
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Ocena {assessment.id.slice(0, 8)}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(assessment.created_at).toLocaleDateString('sl-SI')}
                        </p>
                      </div>
                      {assessment.overall_score && (
                        <div className="text-right">
                          <div className="text-3xl font-bold text-blue-600">
                            {assessment.overall_score.toFixed(1)}
                          </div>
                          <p className="text-xs text-muted-foreground">/ 5.0</p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => navigate(`/assessments/${assessment.id}`)}
                        variant="outline"
                        size="sm"
                      >
                        Preglej
                      </Button>
                      <Button 
                        onClick={() => navigate(`/assessment/domains`)}
                        variant="outline"
                        size="sm"
                      >
                        Domene
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8">
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              ← Nazaj na Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
