import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { tasksAPI } from '@/lib/api';
import { Calendar, User, ArrowLeft } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee_email?: string;
  deadline?: string;
  recommendation_id?: string;
}

const STATUS_LABELS = {
  todo: 'Za opraviti',
  in_progress: 'V izvajanju',
  completed: 'Zaključeno',
  cancelled: 'Preklicano',
};

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function LowActionsPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLowTasks();
  }, []);

  const loadLowTasks = async () => {
    try {
      const response = await tasksAPI.list({ priority_filter: 'low' });
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to load low priority tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-green-600">Nizki ukrepi</h1>
            <p className="text-muted-foreground">
              Ukrepi z nizko prioriteto - dolgoročne izboljšave
            </p>
          </div>

          {loading ? (
            <p>Nalaganje...</p>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Ni nalog z nizko prioriteto.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {task.recommendation_id && (
                            <span className="text-xs font-semibold text-blue-600 uppercase">
                              {task.recommendation_id}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[task.status]}`}>
                            {STATUS_LABELS[task.status]}
                          </span>
                        </div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                        NIZKO
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {task.assignee_email && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {task.assignee_email}
                        </div>
                      )}
                      {task.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(task.deadline).toLocaleDateString('sl-SI')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <Button onClick={() => navigate('/actions/medium')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Srednji ukrepi
            </Button>
            <Button onClick={() => navigate('/actions/timeline')} variant="outline">
              Časovnica
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
