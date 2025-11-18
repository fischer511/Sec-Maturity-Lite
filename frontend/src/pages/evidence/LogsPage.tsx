import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function LogsPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dnevniki</h1>
            <p className="text-muted-foreground">
              Repozitorij varnostnih dnevnikov in zapisov
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Naloženi dnevniki</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📈</span>
                    <div>
                      <div className="font-semibold text-sm">Firewall logs - Januar 2025</div>
                      <div className="text-xs text-muted-foreground">Naloženo: 20.01.2025 | Velikost: 45 MB</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">👁 Pregled</Button>
                    <Button size="sm" variant="outline">⬇ Prenesi</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📈</span>
                    <div>
                      <div className="font-semibold text-sm">Access logs - Active Directory</div>
                      <div className="text-xs text-muted-foreground">Naloženo: 18.01.2025 | Velikost: 12 MB</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">👁 Pregled</Button>
                    <Button size="sm" variant="outline">⬇ Prenesi</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📈</span>
                    <div>
                      <div className="font-semibold text-sm">IDS/IPS alerts - Q4 2024</div>
                      <div className="text-xs text-muted-foreground">Naloženo: 15.01.2025 | Velikost: 28 MB</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">👁 Pregled</Button>
                    <Button size="sm" variant="outline">⬇ Prenesi</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📈</span>
                    <div>
                      <div className="font-semibold text-sm">Vulnerability scan results</div>
                      <div className="text-xs text-muted-foreground">Naloženo: 12.01.2025 | Velikost: 8 MB</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">👁 Pregled</Button>
                    <Button size="sm" variant="outline">⬇ Prenesi</Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Button className="w-full">📤 Naloži nov dnevnik</Button>
              </div>

              <div className="mt-4">
                <p className="text-sm text-muted-foreground italic">
                  Opomba: Funkcionalnost nalaganja dokumentov bo implementirana v prihodnosti.
                  Trenutno prikazujemo primer strukture knjižnice dnevnikov.
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
