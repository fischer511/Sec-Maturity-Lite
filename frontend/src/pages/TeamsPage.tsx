import { useState, useEffect } from 'react';
import { teamsAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import Layout from '../components/Layout';

interface Team {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export default function TeamsPage() {
  const { user } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    if (!user?.org_id) return;
    
    try {
      setLoading(true);
      const response = await teamsAPI.list(user.org_id);
      setTeams(response.data);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!user?.org_id || !newTeamName.trim()) return;

    try {
      await teamsAPI.create(user.org_id, {
        name: newTeamName,
        description: newTeamDescription || undefined,
      });
      
      setNewTeamName('');
      setNewTeamDescription('');
      setShowCreateForm(false);
      loadTeams();
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Ali ste prepričani, da želite izbrisati ta team?')) return;

    try {
      await teamsAPI.delete(teamId);
      loadTeams();
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Nalagam...</div>;
  }

  return (
    <Layout>
      <div className="min-h-full bg-gray-50 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Teams</h1>
          
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? 'Prekliči' : 'Dodaj Team'}
            </Button>
          )}
        </div>

        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Nov Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ime</label>
                  <Input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="IT Security"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Opis</label>
                  <textarea
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="Information security team"
                    rows={3}
                    className="w-full border rounded-md p-2"
                  />
                </div>
                <Button onClick={handleCreateTeam} className="w-full">
                  Ustvari
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {team.description || 'Ni opisa'}
                </p>
                <p className="text-xs text-gray-400">
                  Ustvarjeno: {new Date(team.created_at).toLocaleDateString('sl-SI')}
                </p>
                
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    Izbriši
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Ni teams. Dodajte prvega!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
