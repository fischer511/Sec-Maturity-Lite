import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const DOMAINS = [
  { code: 'governance', name: 'Upravljanje in tveganja', completion: 85, color: 'bg-blue-500' },
  { code: 'policies', name: 'Politike', completion: 70, color: 'bg-green-500' },
  { code: 'asset', name: 'Upravljanje sredstev', completion: 60, color: 'bg-purple-500' },
  { code: 'access', name: 'Nadzor dostopa', completion: 90, color: 'bg-indigo-500' },
  { code: 'monitoring', name: 'Spremljanje in beleženje', completion: 45, color: 'bg-yellow-500' },
  { code: 'incident', name: 'Odziv na incidente', completion: 55, color: 'bg-red-500' },
  { code: 'continuity', name: 'Poslovna kontinuiteta', completion: 75, color: 'bg-teal-500' },
  { code: 'awareness', name: 'Ozaveščanje in usposabljanje', completion: 40, color: 'bg-orange-500' },
  { code: 'it_security', name: 'IT/OT varnost', completion: 65, color: 'bg-cyan-500' },
  { code: 'privacy', name: 'Zasebnost in zakonodaja', completion: 80, color: 'bg-pink-500' },
];

export default function DomainsPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Vse domene</h1>
            <p className="text-muted-foreground">
              Pregled vseh domen varnostne ocene z odstotkom dokončanosti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DOMAINS.map((domain) => (
              <Card key={domain.code} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{domain.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {domain.code}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {domain.completion}%
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Progress bar */}
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full ${domain.color} transition-all`}
                      style={{ width: `${domain.completion}%` }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/assessment/domain/${domain.code}`)}
                      className="flex-1"
                    >
                      Odgovori
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/assessment/evidence?domain=${domain.code}`)}
                      className="flex-1"
                    >
                      Dokazi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <Button onClick={() => navigate('/assessments/new')} className="bg-blue-600 hover:bg-blue-700">
              Nova ocena
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              ← Nazaj na Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
