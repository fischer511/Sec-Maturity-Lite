import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function BrandingPage() {
  const navigate = useNavigate();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Blagovna znamka</h1>
            <p className="text-muted-foreground">
              Prilagoditev vizualnega izgleda aplikacije
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Logotip podjetja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full" />
                    ) : (
                      <span className="text-sm text-gray-400">Ni logotipa</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-3">
                      Naložite logotip podjetja (priporočena velikost: 200x200px, PNG ali JPG)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Barvna shema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Primarna barva</label>
                  <div className="flex gap-4 items-center mt-2">
                    <input
                      type="color"
                      className="w-16 h-10 rounded border cursor-pointer"
                      defaultValue="#3b82f6"
                    />
                    <input
                      type="text"
                      className="flex-1 p-2 bg-white rounded border"
                      defaultValue="#3b82f6"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Sekundarna barva</label>
                  <div className="flex gap-4 items-center mt-2">
                    <input
                      type="color"
                      className="w-16 h-10 rounded border cursor-pointer"
                      defaultValue="#10b981"
                    />
                    <input
                      type="text"
                      className="flex-1 p-2 bg-white rounded border"
                      defaultValue="#10b981"
                      placeholder="#10b981"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Barva ozadja</label>
                  <div className="flex gap-4 items-center mt-2">
                    <input
                      type="color"
                      className="w-16 h-10 rounded border cursor-pointer"
                      defaultValue="#f9fafb"
                    />
                    <input
                      type="text"
                      className="flex-1 p-2 bg-white rounded border"
                      defaultValue="#f9fafb"
                      placeholder="#f9fafb"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Poročila - prilagoditve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-semibold text-sm">Logotip na PDF poročilih</div>
                  <div className="text-xs text-muted-foreground">Dodaj logotip podjetja na izvožena PDF poročila</div>
                </div>
                <input type="checkbox" className="w-4 h-4" defaultChecked />
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-semibold text-sm">Barvna shema poročil</div>
                  <div className="text-xs text-muted-foreground">Uporabi barvno shemo podjetja v poročilih</div>
                </div>
                <input type="checkbox" className="w-4 h-4" defaultChecked />
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Noga poročila (footer)</label>
                <textarea
                  className="w-full p-3 bg-white rounded border mt-1"
                  rows={3}
                  placeholder="Besedilo, ki se prikaže na dnu PDF poročila"
                  defaultValue="Demo d.o.o. | Slovenska cesta 1, Ljubljana | www.demo.si"
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
