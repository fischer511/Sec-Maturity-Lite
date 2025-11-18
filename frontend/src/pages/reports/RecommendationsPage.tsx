import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { assessmentsAPI, usersAPI } from '@/lib/api';

interface Recommendation {
  id: string;
  title: string;
  details: string;
  domain: string;
}

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const userResponse = await usersAPI.getMe();
      const orgId = userResponse.data.org_id;
      
      if (!orgId) {
        console.error('No org_id found');
        setLoading(false);
        return;
      }
      
      const assessmentsResponse = await assessmentsAPI.list(orgId);
      
      // Get latest finalized assessment
      const finalized = assessmentsResponse.data.filter((a: any) => a.overall_score);
      
      if (finalized.length > 0) {
        // Sort by date to get the most recent
        finalized.sort((a: any, b: any) => new Date(b.assessed_at).getTime() - new Date(a.assessed_at).getTime());
        const latest = finalized[0];
        
        const recsResponse = await assessmentsAPI.getRecommendations(latest.id);
        
        // Backend returns { recommendations: [...] }
        const recs = recsResponse.data?.recommendations || recsResponse.data || [];
        setRecommendations(Array.isArray(recs) ? recs : []);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDomainLabel = (domain: string) => {
    const labels: Record<string, string> = {
      governance: 'Upravljanje',
      asset: 'Sredstva',
      access: 'Dostop',
      operations: 'Operacije',
      incident: 'Incidenti',
      continuity: 'Kontinuiteta',
      compliance: 'Skladnost',
      security: 'Varnost'
    };
    return labels[domain] || domain;
  };

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Povzetek priporočil</h1>
            <p className="text-muted-foreground">
              Priporočila za izboljšanje varnostne zrelosti
            </p>
          </div>

          {loading ? (
            <p>Nalaganje...</p>
          ) : recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Ni priporočil. Najprej zaključite oceno.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <Card key={rec.id || idx} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-semibold text-blue-600 uppercase mb-1">
                          {getDomainLabel(rec.domain)}
                        </div>
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                        {rec.id}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{rec.details}</p>
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
