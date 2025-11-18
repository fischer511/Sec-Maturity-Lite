import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function PoliciesPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Politike</h1>
            <p className="text-muted-foreground">
              Repozitorij varnostnih politik in predpisov
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Naložene politike</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-semibold text-sm">Politika varovanja informacij</div>
                      <div className="text-xs text-muted-foreground">Naloženo: 15.01.2025</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Pregled</Button>
                    <Button size="sm" variant="outline">Prenesi</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-semibold text-sm">Politika upravljanja dostopa</div>
                      <div className="text-xs text-muted-foreground">Naloženo: 12.01.2025</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Pregled</Button>
                    <Button size="sm" variant="outline">Prenesi</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-semibold text-sm">Politika upravljanja incidentov</div>
                      <div className="text-xs text-muted-foreground">Naloženo: 08.01.2025</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Pregled</Button>
                    <Button size="sm" variant="outline">Prenesi</Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Button className="w-full">Naloži novo politiko</Button>
              </div>

              <div className="mt-4">
                <p className="text-sm text-muted-foreground italic">
                  Opomba: Funkcionalnost nalaganja dokumentov bo implementirana v prihodnosti.
                  Trenutno prikazujemo primer strukture knjižnice politik.
                </p>
              </div>
            </CardContent>
          </Card>

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
