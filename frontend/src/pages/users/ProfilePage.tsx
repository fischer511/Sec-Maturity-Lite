import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Moj profil</h1>
            <p className="text-muted-foreground">
              Upravljanje uporabniškega profila in nastavitev
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Osebni podatki</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Email</label>
                <div className="p-3 bg-gray-50 rounded border mt-1">
                  {user?.email || 'admin@example.com'}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Ime</label>
                <div className="p-3 bg-gray-50 rounded border mt-1">
                  Admin User
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Vloga</label>
                <div className="p-3 bg-gray-50 rounded border mt-1">
                  {user?.role === 'admin' ? 'Administrator' : 'Uporabnik'}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-muted-foreground">Organizacija</label>
                <div className="p-3 bg-gray-50 rounded border mt-1">
                  Demo organizacija
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="mr-2">Uredi profil</Button>
                <Button variant="outline">Spremeni geslo</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nastavitve obvestil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-semibold text-sm">Email obvestila</div>
                  <div className="text-xs text-muted-foreground">Prejemanje obvestil o novih ocenah in ukrepih</div>
                </div>
                <input type="checkbox" className="w-4 h-4" defaultChecked />
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-semibold text-sm">Tedenska poročila</div>
                  <div className="text-xs text-muted-foreground">Prejemanje tedenskih poročil o napredku</div>
                </div>
                <input type="checkbox" className="w-4 h-4" defaultChecked />
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-semibold text-sm">Opomniki rokov</div>
                  <div className="text-xs text-muted-foreground">Opozorila o približujočih se rokih ukrepov</div>
                </div>
                <input type="checkbox" className="w-4 h-4" defaultChecked />
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
