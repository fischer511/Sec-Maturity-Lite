import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function ReportsHistoryPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Zgodovina poročil</h1>
            <p className="text-muted-foreground">
              Preglejte zgodovino generiranih poročil
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Export zgodovina</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ta stran bo prikazovala zgodovino vseh generiranih PDF in CSV poročil,
                vključno z datumom generiranja in možnostjo ponovnega prenosa.
              </p>
            </CardContent>
          </Card>

          <div className="mt-8 flex gap-4">
            <Button onClick={() => navigate('/reports/export')}>
              Generiraj poročilo
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              ← Nazaj
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
