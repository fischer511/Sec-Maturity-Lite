import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { assessmentsAPI, tasksAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface Assessment {
  id: string;
  org_id?: string;
  overall_score?: number | null;
  created_at: string;
  assessed_at?: string | null; // used as finalized date
  status?: string;
  // backend returns `domains` (AssessmentDomainResponse) - keep flexible
  domains?: Array<{
    domain: string;
    score: number;
  }>;
  // legacy frontend field support
  domain_scores?: Array<{
    domain: string;
    score: number;
  }>;
}

interface Recommendation {
  domain: string;
  domain_label: string;
  priority: string;
  title: string;
  description: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  governance: 'Upravljanje',
  asset: 'Upravljanje sredstev',
  access: 'Nadzor dostopa',
  operations: 'Varnost operacij',
  incident: 'Upravljanje incidentov',
  continuity: 'Poslovna kontinuiteta',
};

export default function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [creatingTask, setCreatingTask] = useState<string | null>(null);

  const handleCreateTask = async (recommendationId: string) => {
    if (!id) return;
    
    try {
      setCreatingTask(recommendationId);
      await tasksAPI.createFromRecommendation(id, recommendationId);
      alert('Naloga uspešno ustvarjena! Preverite stran "Načrt sanacije".');
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Napaka pri ustvarjanju naloge');
    } finally {
      setCreatingTask(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch assessment details
        const assessmentResponse = await assessmentsAPI.get(id);
        setAssessment(assessmentResponse.data);
        
        // Fetch recommendations if assessment is finalized
        if (assessmentResponse.data.status === 'finalized') {
          const recsResponse = await assessmentsAPI.getRecommendations(id);
          const recs = recsResponse.data;
          if (Array.isArray(recs)) {
            setRecommendations(recs);
          }
        }
      } catch (error) {
        console.error('Failed to load assessment:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!id) return;
    
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
    }
  };

  const handleDownloadCSV = async () => {
    if (!id) return;
    
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
    }
  };

  const handleFinalize = async () => {
    if (!id) return;
    
    const confirmed = window.confirm(
      'Ali želiš zaključiti to oceno? To bo izračunalo končne rezultate in priporočila.'
    );
    
    if (!confirmed) return;
    
    try {
      setFinalizing(true);
      await assessmentsAPI.finalize(id);
      
      // Reload assessment data
      const assessmentResponse = await assessmentsAPI.get(id);
      setAssessment(assessmentResponse.data);
      
      // Load recommendations
      const recsResponse = await assessmentsAPI.getRecommendations(id);
      const recs = recsResponse.data;
      if (Array.isArray(recs)) {
        setRecommendations(recs);
      }
      
      alert('Ocena je bila uspešno zaključena!');
    } catch (error) {
      console.error('Failed to finalize assessment:', error);
      alert('Napaka pri zaključevanju ocene. Preveri, da so vsi odgovori izpolnjeni.');
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">Nalaganje...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Ocena ni najdena</h3>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Nazaj na nadzorno ploščo
          </Button>
        </Card>
      </div>
    );
  }

  // Support backend `domains` or legacy `domain_scores`
  const domainList = assessment.domains ?? assessment.domain_scores ?? [];

  const domainChartData = domainList.map((d) => ({
    domain: DOMAIN_LABELS[d.domain] || d.domain,
    score: typeof d.score === 'number' ? d.score : Number(d.score) || 0,
  }));

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
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Ocena {assessment.id}</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Status: <strong className="text-gray-900">{assessment.status === 'finalized' ? 'Zaključeno' : 'Osnutek'}</strong></span>
            <span>•</span>
            <span>Ustvarjeno: <strong className="text-gray-900">{new Date(assessment.created_at).toLocaleDateString('sl-SI')}</strong></span>
            {assessment.assessed_at && (
              <>
                <span>•</span>
                <span>Zaključeno: <strong className="text-gray-900">{new Date(assessment.assessed_at).toLocaleDateString('sl-SI')}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Overall Score */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Skupna ocena</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {(assessment.overall_score ?? 0).toFixed(1)}
              </div>
              <p className="text-muted-foreground">od 5.0</p>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ocene po domenah</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={domainChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="domain" />
                <PolarRadiusAxis domain={[0, 5]} />
                <Radar 
                  name="Ocena" 
                  dataKey="score" 
                  stroke="#2563eb" 
                  fill="#2563eb" 
                  fillOpacity={0.6} 
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Domain Scores Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Podrobnosti po domenah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {domainList.map((d) => (
                <div key={d.domain} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">{DOMAIN_LABELS[d.domain] || d.domain}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${(d.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-blue-600 w-16 text-right">
                      {(d.score ?? 0).toFixed(1)} / 5.0
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Priporočila za izboljšave</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-blue-600 uppercase">
                          {rec.domain_label}
                        </span>
                        <h4 className="font-semibold text-base mt-1">{rec.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span 
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            rec.priority === 'high' 
                              ? 'bg-red-100 text-red-800' 
                              : rec.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {rec.priority === 'high' ? 'Visoka' : rec.priority === 'medium' ? 'Srednja' : 'Nizka'}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleCreateTask((rec as any).id || '')}
                          disabled={creatingTask !== null}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {creatingTask === (rec as any).id ? '...' : 'Ustvari nalogo'}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {assessment.status === 'draft' && (
            <>
              <Button 
                onClick={handleFinalize} 
                size="lg" 
                className="bg-green-600 hover:bg-green-700"
                disabled={finalizing}
              >
                {finalizing ? 'Zaključujem...' : 'Zaključi oceno in izračunaj rezultate'}
              </Button>
              <Button onClick={() => navigate('/imports')} variant="outline" size="lg">
                Uvozi več podatkov (CSV)
              </Button>
            </>
          )}
          
          {assessment.status === 'finalized' && (
            <>
              <Button onClick={handleDownloadPDF} size="lg" className="bg-blue-600 hover:bg-blue-700">
                Prenesi PDF poročilo
              </Button>
              <Button onClick={handleDownloadCSV} size="lg" variant="outline">
                Prenesi CSV
              </Button>
            </>
          )}
          
          <Button onClick={() => navigate('/dashboard')} variant="outline" size="lg">
            Nazaj na nadzorno ploščo
          </Button>
        </div>
      </main>
    </div>
  );
}
