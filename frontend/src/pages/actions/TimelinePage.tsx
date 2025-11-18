import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function TimelinePage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Časovnica ukrepov</h1>
            <p className="text-muted-foreground">
              Vizualni prikaz načrta izvajanja varnostnih ukrepov
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Načrt izvajanja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-2">Q1 2025 (Januar - Marec)</h3>
                <div className="pl-4 border-l-4 border-red-500 space-y-2">
                  <div className="p-3 bg-red-50 rounded">
                    <div className="font-semibold text-sm">Kritični ukrepi</div>
                    <p className="text-xs text-muted-foreground">Implementacija MFA, posodobitev zastarele programske opreme</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">Q2 2025 (April - Junij)</h3>
                <div className="pl-4 border-l-4 border-yellow-500 space-y-2">
                  <div className="p-3 bg-yellow-50 rounded">
                    <div className="font-semibold text-sm">Srednji ukrepi</div>
                    <p className="text-xs text-muted-foreground">Izboljšanje upravljanja ranljivosti, usposabljanje zaposlenih</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">Q3-Q4 2025 (Julij - December)</h3>
                <div className="pl-4 border-l-4 border-green-500 space-y-2">
                  <div className="p-3 bg-green-50 rounded">
                    <div className="font-semibold text-sm">Nizki ukrepi</div>
                    <p className="text-xs text-muted-foreground">Optimizacija procesov, dodatna dokumentacija</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground italic">
                  Opomba: Časovnica bo avtomatsko generirana na podlagi prioritet in rokov ukrepov.
                  Trenutno prikazujemo primer časovnega razporeda.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex gap-4">
            <Button onClick={() => navigate('/actions/low')} variant="outline">
              ← Nizki ukrepi
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
