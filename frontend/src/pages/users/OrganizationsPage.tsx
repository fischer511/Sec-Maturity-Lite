import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function OrganizationsPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Organizacije</h1>
            <p className="text-muted-foreground">
              Upravljanje organizacij in njihovih nastavitev
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Moje organizacije</CardTitle>
                <Button size="sm">+ Nova organizacija</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 border rounded bg-blue-50 border-blue-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-lg">Demo organizacija</div>
                      <div className="text-sm text-muted-foreground mt-1">Aktivna organizacija</div>
                      <div className="mt-3 text-sm">
                        <div>Članov ekipe: 15</div>
                        <div>Aktifnih ocen: 3</div>
                        <div>Zaključenih ocen: 12</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Nastavitve</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate('/teams')}>
                        Ekipe
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Podrobnosti organizacije</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Naziv organizacije</label>
                <div className="p-3 bg-gray-50 rounded border mt-1">
                  Demo organizacija
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">ID organizacije</label>
                <div className="p-3 bg-gray-50 rounded border mt-1 font-mono text-xs">
                  org_abc123def456
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Datum ustanovitve</label>
                <div className="p-3 bg-gray-50 rounded border mt-1">
                  01.01.2025
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Paket</label>
                <div className="p-3 bg-gray-50 rounded border mt-1">
                  Professional
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline">✏️ Uredi organizacijo</Button>
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
