import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { domainWeightsAPI } from '@/lib/api';
import { Scale, Save, RotateCcw, Info } from 'lucide-react';

interface DomainWeight {
  id: string;
  org_id: string;
  domain: string;
  weight: number;
  description: string | null;
}

const DOMAIN_LABELS: Record<string, string> = {
  governance: 'Governance & Risk Management',
  access_control: 'Access Control & Identity Management',
  data_protection: 'Data Protection & Privacy',
  network_security: 'Network Security',
  endpoint_security: 'Endpoint Security',
  app_security: 'Application Security',
  incident_response: 'Incident Response & Recovery',
  compliance: 'Compliance & Legal',
  awareness_training: 'Security Awareness & Training',
  physical_security: 'Physical Security',
};

const ALL_DOMAINS = Object.keys(DOMAIN_LABELS);

export default function DomainWeightsPage() {
  const navigate = useNavigate();
  const [weights, setWeights] = useState<DomainWeight[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localWeights, setLocalWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    loadWeights();
  }, []);

  const loadWeights = async () => {
    try {
      const response = await domainWeightsAPI.list();
      setWeights(response.data);
      
      // Initialize local weights
      const weightMap: Record<string, number> = {};
      response.data.forEach((w: DomainWeight) => {
        weightMap[w.domain] = w.weight;
      });
      
      // Set default weight of 1.0 for domains without custom weights
      ALL_DOMAINS.forEach(domain => {
        if (!(domain in weightMap)) {
          weightMap[domain] = 1.0;
        }
      });
      
      setLocalWeights(weightMap);
    } catch (error) {
      console.error('Failed to load domain weights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (domain: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalWeights(prev => ({ ...prev, [domain]: numValue }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update or create weights for each domain
      for (const domain of ALL_DOMAINS) {
        const newWeight = localWeights[domain];
        const existing = weights.find(w => w.domain === domain);
        
        if (existing) {
          // Update existing weight
          await domainWeightsAPI.update(existing.id, {
            weight: newWeight,
            description: DOMAIN_LABELS[domain],
          });
        } else {
          // Create new weight
          await domainWeightsAPI.create({
            domain,
            weight: newWeight,
            description: DOMAIN_LABELS[domain],
          });
        }
      }
      
      // Reload weights
      await loadWeights();
      alert('Uteži uspešno shranjene!');
    } catch (error) {
      console.error('Failed to save weights:', error);
      alert('Napaka pri shranjevanju uteži');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const resetWeights: Record<string, number> = {};
    ALL_DOMAINS.forEach(domain => {
      resetWeights[domain] = 1.0;
    });
    setLocalWeights(resetWeights);
  };

  const getTotalWeight = () => {
    return Object.values(localWeights).reduce((sum, w) => sum + w, 0);
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 bg-gray-50 min-h-full flex items-center justify-center">
          <p>Nalaganje...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex items-center gap-3">
            <Scale className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Uteži domen</h1>
              <p className="text-muted-foreground">
                Prilagodite pomen posameznih varnostnih domen za vašo organizacijo
              </p>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader className="bg-blue-50 border-b">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <CardTitle className="text-lg">Kako delujejo uteži?</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Uteži določajo relativni pomen posamezne domene pri izračunu končne ocene. 
                    Privzeta vrednost je <strong>1.0</strong> (enaka pomembnost). 
                    Če želite povečati pomen domene, uporabite višjo vrednost (npr. 2.0), 
                    za zmanjšanje pa nižjo (npr. 0.5).
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Skupna vsota uteži:</strong> {getTotalWeight().toFixed(1)}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uteži domen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ALL_DOMAINS.map((domain) => {
                  const weight = localWeights[domain] || 1.0;
                  const percentage = ((weight / getTotalWeight()) * 100).toFixed(1);
                  
                  return (
                    <div key={domain} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{DOMAIN_LABELS[domain]}</div>
                          <div className="text-xs text-muted-foreground">
                            {percentage}% od celotne ocene
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={weight}
                            onChange={(e) => handleWeightChange(domain, e.target.value)}
                            className="w-24 p-2 border rounded text-center"
                          />
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t flex gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Shranjevanje...' : 'Shrani uteži'}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Ponastavi na privzeto
                </Button>
                <Button variant="outline" onClick={() => navigate('/settings')}>
                  Prekliči
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
