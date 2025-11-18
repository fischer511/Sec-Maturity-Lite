import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, Building, User } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pwd: string): { valid: boolean; message?: string } => {
    if (pwd.length < 8) {
      return { valid: false, message: 'Geslo mora imeti vsaj 8 znakov' };
    }
    if (!/[A-Z]/.test(pwd)) {
      return { valid: false, message: 'Geslo mora vsebovati vsaj eno veliko črko' };
    }
    if (!/[a-z]/.test(pwd)) {
      return { valid: false, message: 'Geslo mora vsebovati vsaj eno malo črko' };
    }
    if (!/[0-9]/.test(pwd)) {
      return { valid: false, message: 'Geslo mora vsebovati vsaj eno številko' };
    }
    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Vsa polja so obvezna');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message || 'Neveljavno geslo');
      return;
    }

    if (password !== confirmPassword) {
      setError('Gesli se ne ujemata');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        email,
        password,
        full_name: fullName || undefined,
        org_name: orgName || undefined,
      });

      // Store token and navigate to dashboard
      setAuth(response.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registracija ni uspela. Prosim poskusite znova.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength: 25, label: 'Šibko', color: 'bg-red-500' };
    if (strength === 3) return { strength: 50, label: 'Srednje', color: 'bg-yellow-500' };
    if (strength === 4) return { strength: 75, label: 'Dobro', color: 'bg-blue-500' };
    return { strength: 100, label: 'Močno', color: 'bg-green-500' };
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Registracija</CardTitle>
          <CardDescription className="text-center">
            Ustvarite nov račun za dostop do Security Maturity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ime@podjetje.si"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Ime in priimek (opcijsko)</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Janez Novak"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgName">Naziv organizacije (opcijsko)</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="orgName"
                  type="text"
                  placeholder="Moje podjetje d.o.o."
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500">
                Če vnesete naziv, boste postali administrator nove organizacije
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Geslo</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordStrength && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Moč gesla:</span>
                    <span className={`font-medium ${
                      passwordStrength.strength === 100 ? 'text-green-600' :
                      passwordStrength.strength >= 75 ? 'text-blue-600' :
                      passwordStrength.strength >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potrdite geslo</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registracija...' : 'Registriraj se'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Že imate račun? </span>
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Prijavite se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
