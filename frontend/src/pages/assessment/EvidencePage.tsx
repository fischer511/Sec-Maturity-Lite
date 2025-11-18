import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function EvidencePage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dokazi / Evidence</h1>
            <p className="text-muted-foreground">
              Prilagajte dokaze k odgovorom v oceni varnosti
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evidence Library</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Naložite in povežite dokumente z vašimi odgovori:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span>Varnostne politike</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>Postopki in procedure</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>Mrežne diagrame</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>Incident logs</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>Zakonodajne dokumente</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Prihajajoče funkcionalnosti:</strong> Nalaganje dokumentov,
                  povezovanje z odgovori, organizacija po domenah
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              ← Nazaj na Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
