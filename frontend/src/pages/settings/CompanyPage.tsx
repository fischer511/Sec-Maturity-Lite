import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function CompanyPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Podatki podjetja</h1>
            <p className="text-muted-foreground">
              Osnovna informacija in kontaktni podatki
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Osnovni podatki</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Naziv podjetja</label>
                <input
                  type="text"
                  className="w-full p-3 bg-white rounded border mt-1"
                  placeholder="Demo d.o.o."
                  defaultValue="Demo d.o.o."
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Davčna številka</label>
                <input
                  type="text"
                  className="w-full p-3 bg-white rounded border mt-1"
                  placeholder="SI12345678"
                  defaultValue="SI12345678"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Matična številka</label>
                <input
                  type="text"
                  className="w-full p-3 bg-white rounded border mt-1"
                  placeholder="1234567000"
                  defaultValue="1234567000"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Kontaktni podatki</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Naslov</label>
                <input
                  type="text"
                  className="w-full p-3 bg-white rounded border mt-1"
                  placeholder="Slovenska cesta 1"
                  defaultValue="Slovenska cesta 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Poštna številka</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-white rounded border mt-1"
                    placeholder="1000"
                    defaultValue="1000"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Kraj</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-white rounded border mt-1"
                    placeholder="Ljubljana"
                    defaultValue="Ljubljana"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Država</label>
                <input
                  type="text"
                  className="w-full p-3 bg-white rounded border mt-1"
                  placeholder="Slovenija"
                  defaultValue="Slovenija"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Telefon</label>
                <input
                  type="text"
                  className="w-full p-3 bg-white rounded border mt-1"
                  placeholder="+386 1 234 5678"
                  defaultValue="+386 1 234 5678"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Email</label>
                <input
                  type="email"
                  className="w-full p-3 bg-white rounded border mt-1"
                  placeholder="info@demo.si"
                  defaultValue="info@demo.si"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Spletna stran</label>
                <input
                  type="url"
                  className="w-full p-3 bg-white rounded border mt-1"
                  placeholder="https://www.demo.si"
                  defaultValue="https://www.demo.si"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button>Shrani spremembe</Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              ← Nazaj
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
