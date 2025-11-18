import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { tasksAPI, usersAPI } from '@/lib/api';
import { Calendar, User } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee_id?: string;
  assignee_email?: string;
  deadline?: string;
  domain?: string;
  recommendation_id?: string;
}

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrgUser {
  id: string;
  email: string;
  role: string;
}

export default function TaskDetailDialog({ task, open, onClose, onSuccess }: TaskDetailDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as const,
    priority: 'medium' as const,
    assignee_id: '',
    deadline: '',
  });
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task && open) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assignee_id: task.assignee_id || '',
        deadline: task.deadline ? task.deadline.split('T')[0] : '',
      });
      loadUsers();
    }
  }, [task, open]);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getMe();
      const currentUser = response.data;
      
      // For now, just show current user
      // In production, fetch all users from org
      setUsers([{ id: currentUser.id, email: currentUser.email, role: currentUser.role }]);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      setLoading(true);
      
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
      };

      if (formData.assignee_id) {
        updateData.assignee_id = formData.assignee_id;
      }

      if (formData.deadline) {
        updateData.deadline = new Date(formData.deadline).toISOString();
      }

      await tasksAPI.update(task.id, updateData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Napaka pri posodobitvi naloge');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (!confirm('Ali ste prepričani, da želite izbrisati to nalogo?')) {
      return;
    }

    try {
      setLoading(true);
      await tasksAPI.delete(task.id);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Napaka pri brisanju naloge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Uredi nalogo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Naslov *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Opis</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={4}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="todo">Za narediti</option>
                <option value="in_progress">V teku</option>
                <option value="completed">Zaključeno</option>
                <option value="cancelled">Preklicano</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Prioriteta</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="low">Nizka</option>
                <option value="medium">Srednja</option>
                <option value="high">Visoka</option>
                <option value="critical">Kritična</option>
              </select>
            </div>
          </div>

          {/* Assignee and Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Odgovoren
              </label>
              <select
                value={formData.assignee_id}
                onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">-- Ni dodeljenega --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Rok
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          {/* Domain and Recommendation Info */}
          {(task?.domain || task?.recommendation_id) && (
            <div className="p-3 bg-gray-50 rounded border">
              <div className="text-sm text-muted-foreground space-y-1">
                {task.domain && (
                  <div>
                    <span className="font-medium">Domena:</span> {task.domain}
                  </div>
                )}
                {task.recommendation_id && (
                  <div>
                    <span className="font-medium">Priporočilo:</span> {task.recommendation_id}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={loading}
              className="text-red-600 hover:bg-red-50"
            >
              Izbriši
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Prekliči
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Shranjujem...' : 'Shrani'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
