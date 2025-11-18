import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Shield, 
  FileText, 
  CheckSquare, 
  FolderOpen,
  Users,
  Settings,
  List,
  FileEdit,
  CheckCircle,
  Paperclip,
  Download,
  History,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  FileCheck,
  Network,
  Activity,
  User,
  Building,
  Palette,
  Upload,
  ListTodo,
  LogOut,
  ChevronDown,
  ChevronRight,
  Scale
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { 
    path: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard
  },
  { 
    path: '/assessment', 
    label: 'Ocena varnosti', 
    icon: Shield,
    children: [
      { path: '/assessment/domains', label: 'Vse domene', icon: List },
      { path: '/assessment/my', label: 'Moja ocena', icon: FileEdit },
      { path: '/assessment/answers', label: 'Odgovori', icon: CheckCircle },
      { path: '/assessment/evidence', label: 'Dokazi', icon: Paperclip },
    ]
  },
  { 
    path: '/reports', 
    label: 'Poročila', 
    icon: FileText,
    children: [
      { path: '/reports/export', label: 'PDF Export', icon: Download },
      { path: '/reports/history', label: 'Zgodovina', icon: History },
      { path: '/reports/recommendations', label: 'Priporočila', icon: Lightbulb },
    ]
  },
  { 
    path: '/actions', 
    label: 'Ukrepi', 
    icon: CheckSquare,
    children: [
      { path: '/actions/critical', label: 'Kritični', icon: AlertTriangle },
      { path: '/actions/medium', label: 'Srednji', icon: AlertCircle },
      { path: '/actions/low', label: 'Nizki', icon: Info },
      { path: '/actions/timeline', label: 'Rokovni načrt', icon: Calendar },
    ]
  },
  { 
    path: '/tasks', 
    label: 'Načrt sanacije', 
    icon: ListTodo
  },
  { 
    path: '/evidence', 
    label: 'Evidenca', 
    icon: FolderOpen,
    children: [
      { path: '/evidence/policies', label: 'Politike', icon: FileCheck },
      { path: '/evidence/procedures', label: 'Postopki', icon: FileEdit },
      { path: '/evidence/network', label: 'Strukture omrežja', icon: Network },
      { path: '/evidence/logs', label: 'Incident logs', icon: Activity },
    ]
  },
  { 
    path: '/users', 
    label: 'Uporabniki', 
    icon: Users,
    children: [
      { path: '/users/profile', label: 'Moj profil', icon: User },
      { path: '/users/organizations', label: 'Organizacije', icon: Building },
      { path: '/teams', label: 'Člani ekipe', icon: Users },
    ]
  },
  { 
    path: '/settings', 
    label: 'Nastavitve', 
    icon: Settings,
    children: [
      { path: '/settings/company', label: 'Podatki o podjetju', icon: Building },
      { path: '/settings/branding', label: 'Logotip', icon: Palette },
      { path: '/settings/domain-weights', label: 'Uteži domen', icon: Scale },
      { path: '/imports', label: 'Uvoz / Izvoz', icon: Upload },
    ]
  },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/assessment', '/reports', '/actions']);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/dashboard')}
          >
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Sec-Maturity</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => (
            <div key={item.path}>
              <button
                onClick={() => {
                  if (item.children) {
                    toggleMenu(item.path);
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors flex items-center justify-between ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </span>
                {item.children && (
                  expandedMenus.includes(item.path) 
                    ? <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* Submenu */}
              {item.children && expandedMenus.includes(item.path) && (
                <div className="bg-gray-50">
                  {item.children.map((child) => (
                    <button
                      key={child.path}
                      onClick={() => navigate(child.path)}
                      className={`w-full px-4 py-2 pl-12 text-left text-sm transition-colors flex items-center gap-3 ${
                        isActive(child.path)
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <child.icon className="w-3.5 h-3.5" />
                      <span>{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Actions */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Odjava
          </Button>
        </div>
      </aside>
    </div>
  );
}
