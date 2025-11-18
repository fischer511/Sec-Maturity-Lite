import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AnswersPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Odgovori</h1>
            <p className="text-muted-foreground">
              Pregled vseh vaših odgovorov na vprašanja ocene
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Odgovori po domenah</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Ta funkcionalnost bo prikazala vse vaše odgovore organizirane po domenah.
              </p>
              <p className="text-sm text-gray-600">
                Trenutno lahko odgovore urejate preko:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li>Nova ocena (Assessment Wizard)</li>
                <li>CSV uvoz za množično urejanje</li>
              </ul>
            </CardContent>
          </Card>

          <div className="mt-8 flex gap-4">
            <Button onClick={() => navigate('/assessments/new')}>
              Nova ocena
            </Button>
            <Button onClick={() => navigate('/imports')} variant="outline">
              CSV Uvoz
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
