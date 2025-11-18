import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { assessmentsAPI, usersAPI, teamsAPI, tasksAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { 
  LineChart, 
  Line, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { AlertTriangle, Clock } from 'lucide-react';

interface DomainScore {
  domain: string;
  score: number;
  label: string;
}

interface Assessment {
  id: number;
  overall_score: number;
  assessed_at: string;
  created_at?: string;
  status?: string;
  domains?: Array<{
    domain: string;
    score: number;
  }>;
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
}

const DOMAIN_LABELS: Record<string, string> = {
  governance: 'Upravljanje',
  asset: 'Upravljanje sredstev',
  access: 'Nadzor dostopa',
  operations: 'Varnost operacij',
  incident: 'Upravljanje incidentov',
  continuity: 'Poslovna kontinuiteta',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [domainScores, setDomainScores] = useState<DomainScore[]>([]);
  const [trendData, setTrendData] = useState<Array<{ date: string; score: number }>>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [taskStats, setTaskStats] = useState<any>(null);

  // Re-load data whenever component mounts, selected team changes, or URL params change (e.g., reload after wizard)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get user's org first
  const userResponse = await usersAPI.getMe();
  // backend returns `org_id` field
  const orgId = userResponse.data.org_id;
        
        if (!orgId) {
          console.error('No organization ID found for user');
          setLoading(false);
          return;
        }
        
        // Load teams
        try {
          const teamsResponse = await teamsAPI.list(orgId.toString());
          setTeams(teamsResponse.data);
        } catch (error) {
          console.error('Failed to load teams:', error);
        }
        
        // Fetch assessments for the org
        const response = await assessmentsAPI.list(orgId.toString());
        let data = response.data;
        
        // Filter by selected team if not 'all'
        if (selectedTeamId !== 'all') {
          data = data.filter((a: any) => a.team_id === selectedTeamId);
        }
        
        // Filter finalized assessments (those with overall_score set)
        const finalized = data.filter((a: Assessment) => a.overall_score != null && a.overall_score !== undefined);
        
        // Sort by date ascending for proper trend visualization
        finalized.sort((a: Assessment, b: Assessment) => new Date(a.assessed_at).getTime() - new Date(b.assessed_at).getTime());
        
        if (finalized.length === 0) {
          setLoading(false);
          return;
        }
        
        // Get latest assessment for radar chart
        const latest = finalized[finalized.length - 1];
        const latestDomains = latest.domains ?? latest.domain_scores ?? [];
        const domains = latestDomains.map((d: { domain: string; score: number }) => ({
          domain: d.domain,
          score: d.score,
          label: DOMAIN_LABELS[d.domain] || d.domain,
        }));
        setDomainScores(domains);
        
        // Build trend data (all finalized assessments over time)
        const trend = finalized.map((a: Assessment) => {
          const dateObj = new Date(a.assessed_at);
          
          // Format date as "MM/YY" for cleaner display with many data points
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = String(dateObj.getFullYear()).slice(-2);
          const formattedDate = `${month}/${year}`;
          
          return {
            date: formattedDate,
            fullDate: dateObj.toLocaleDateString('sl-SI'),
            score: a.overall_score,
          };
        });
        setTrendData(trend);
        
        // Get recommendations for latest assessment
        if (latest.id) {
          const recsResponse = await assessmentsAPI.getRecommendations(latest.id.toString());
          const recs = recsResponse.data;
          if (Array.isArray(recs)) {
            setRecommendations(recs.slice(0, 5)); // Top 5
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedTeamId, searchParams]); // Re-load when team selection changes or URL params change (e.g., reload after wizard)

  useEffect(() => {
    const loadTaskStats = async () => {
      try {
        const response = await tasksAPI.getStatistics();
        setTaskStats(response.data);
      } catch (error) {
        console.error('Failed to load task statistics:', error);
      }
    };
    loadTaskStats();
  }, []);

  return (
    <Layout>
      <div className="min-h-full bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">Nadzorna plošča</h2>
            <p className="text-muted-foreground">
              Pregled kibernetske zrelosti vaše organizacije
            </p>
          </div>
          
          {teams.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Filtriraj po team-u:</label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Vsi teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nalaganje...</p>
          </div>
        ) : domainScores.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Ni podatkov</h3>
            <p className="text-muted-foreground mb-4">
              Nimate še nobene zaključene ocene. Začnite z novo oceno.
            </p>
            <Button onClick={() => navigate('/assessments/new')} className="bg-blue-600 hover:bg-blue-700">
              Začni novo oceno
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Trend Chart - only show if multiple assessments */}
            {trendData.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Trend splošne ocene</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis domain={[0, 5]} />
                      <Tooltip 
                        labelFormatter={(value, payload) => {
                          if (payload && payload[0] && payload[0].payload.fullDate) {
                            return `Datum: ${payload[0].payload.fullDate}`;
                          }
                          return value;
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        name="Skupna ocena"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Ocene po domenah (zadnja ocena)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={domainScores}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} />
                    <Radar
                      name="Ocena"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tasks Widget */}
            {taskStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                    Aktivne naloge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-red-600" />
                        <div>
                          <p className="font-medium text-red-900">Zamujene naloge</p>
                          <p className="text-sm text-red-600">Zahteva takojšnjo pozornost</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-red-600">{taskStats.overdue || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                        <div>
                          <p className="font-medium text-orange-900">Visoka prioriteta</p>
                          <p className="text-sm text-orange-600">Aktivne naloge s prioriteto HIGH</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-orange-600">{taskStats.by_priority?.HIGH || 0}</span>
                    </div>

                    <div className="pt-2 border-t">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate('/tasks')}
                      >
                        Zobacz vse naloge
                        <span className="ml-2">→</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations List */}
            {/* Domain Scores Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Podrobnosti po domenah</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {domainScores.map((item) => (
                  <Card key={item.domain}>
                    <CardHeader>
                      <CardTitle className="text-base">{item.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-600">
                        {item.score.toFixed(1)} / 5.0
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 priporočil</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendations.map((rec, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-blue-600 uppercase">
                              {rec.domain_label}
                            </span>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {rec.title}
                            </p>
                          </div>
                          <span 
                            className={`ml-2 px-2 py-1 text-xs font-semibold rounded ${
                              rec.priority === 'high' 
                                ? 'bg-red-100 text-red-800' 
                                : rec.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {rec.priority === 'high' ? 'Visoka' : rec.priority === 'medium' ? 'Srednja' : 'Nizka'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
}
