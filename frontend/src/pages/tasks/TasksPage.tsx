import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tasksAPI } from '@/lib/api';
import { AlertCircle, Calendar, CheckCircle2, Clock, Plus, XCircle, Edit } from 'lucide-react';
import TaskDetailDialog from '@/components/TaskDetailDialog';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  domain?: string;
  recommendation_id?: string;
  assignee_email?: string;
  created_by_email: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
  assessment_id: string;
}

interface TaskStatistics {
  total: number;
  todo: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800 border-gray-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
};

const PRIORITY_LABELS = {
  low: 'Nizka',
  medium: 'Srednja',
  high: 'Visoka',
  critical: 'Kritična',
};

const STATUS_COLORS = {
  todo: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS = {
  todo: 'Za narediti',
  in_progress: 'V teku',
  completed: 'Zaključeno',
  cancelled: 'Preklicano',
};

const STATUS_ICONS = {
  todo: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export default function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadTasks();
    loadStatistics();
  }, [filterStatus, filterPriority]);

  const loadTasks = async () => {
    try {
      const params: any = {};
      if (filterStatus) params.status_filter = filterStatus;
      if (filterPriority) params.priority_filter = filterPriority;

      const response = await tasksAPI.list(params);
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await tasksAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      await loadTasks();
      await loadStatistics();
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Napaka pri posodobitvi statusa');
    }
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Nalaganje...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-full">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Načrt sanacije</h1>
                <p className="text-muted-foreground">
                  Upravljanje ukrepov in nalog za izboljšanje varnostne zrelosti
                </p>
              </div>
              <Button onClick={() => navigate('/assessments/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Nova ocena
              </Button>
            </div>

            {/* Statistics Cards */}
            {statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary">{statistics.total}</div>
                    <div className="text-xs text-muted-foreground mt-1">Skupaj</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{statistics.todo}</div>
                    <div className="text-xs text-muted-foreground mt-1">Za narediti</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">{statistics.in_progress}</div>
                    <div className="text-xs text-muted-foreground mt-1">V teku</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{statistics.completed}</div>
                    <div className="text-xs text-muted-foreground mt-1">Zaključeno</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-red-600">{statistics.overdue}</div>
                    <div className="text-xs text-muted-foreground mt-1">Zamujeno</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">{statistics.by_priority.critical}</div>
                    <div className="text-xs text-muted-foreground mt-1">Kritično</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Vsi statusi</option>
                    <option value="todo">Za narediti</option>
                    <option value="in_progress">V teku</option>
                    <option value="completed">Zaključeno</option>
                    <option value="cancelled">Preklicano</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Prioriteta</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Vse prioritete</option>
                    <option value="critical">Kritična</option>
                    <option value="high">Visoka</option>
                    <option value="medium">Srednja</option>
                    <option value="low">Nizka</option>
                  </select>
                </div>
                {(filterStatus || filterPriority) && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilterStatus('');
                        setFilterPriority('');
                      }}
                    >
                      Počisti filtre
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Ni nalog. Ustvarite novo oceno in dodajte ukrepe iz priporočil.
                  </p>
                  <Button onClick={() => navigate('/dashboard')}>
                    ← Nazaj na dashboard
                  </Button>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => {
                const StatusIcon = STATUS_ICONS[task.status];
                const overdueTask = isOverdue(task.deadline) && task.status !== 'completed' && task.status !== 'cancelled';

                return (
                  <Card
                    key={task.id}
                    className={`hover:shadow-md transition-shadow ${overdueTask ? 'border-red-500 border-2' : ''}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        {/* Left: Task Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                PRIORITY_COLORS[task.priority]
                              }`}
                            >
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[task.status]}`}>
                              <StatusIcon className="w-3 h-3 inline mr-1" />
                              {STATUS_LABELS[task.status]}
                            </span>
                            {task.domain && (
                              <span className="text-xs text-muted-foreground">
                                {task.domain}
                              </span>
                            )}
                            {overdueTask && (
                              <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">
                                ZAMUJENO
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {task.description.substring(0, 200)}
                              {task.description.length > 200 && '...'}
                            </p>
                          )}

                          <div className="flex gap-6 text-sm text-muted-foreground">
                            {task.assignee_email && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Odgovoren:</span>
                                <span>{task.assignee_email}</span>
                              </div>
                            )}
                            {task.deadline && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Rok: {new Date(task.deadline).toLocaleDateString('sl-SI')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-col gap-2 ml-4">
                          {task.status !== 'completed' && task.status !== 'cancelled' && (
                            <>
                              {task.status === 'todo' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(task.id, 'in_progress')}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  Začni
                                </Button>
                              )}
                              {task.status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(task.id, 'completed')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Zaključi
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTask(task);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Uredi
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/assessments/${task.assessment_id}`)}
                          >
                            Preglej oceno
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <div className="mt-8">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              ← Nazaj na dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedTask(null);
        }}
        onSuccess={() => {
          loadTasks();
          loadStatistics();
        }}
      />
    </Layout>
  );
}
