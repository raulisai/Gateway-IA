'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, type User } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User as UserIcon,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Loader2,
  Save,
  Key,
  Users as UsersIcon,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  // Profile State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Admin State
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');

      if (user.is_superuser) {
        fetchUsers();
      }
    }
  }, [user]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await apiClient.users.list();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await apiClient.users.updateMe({
        full_name: fullName,
        email: email
      });
      await refreshUser();
      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido guardados correctamente.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "No se pudo actualizar el perfil.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden.",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await apiClient.users.updateMe({
        password: newPassword
      });
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "No se pudo actualizar la contraseña.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAdminResetPassword = async (userId: string, userEmail: string) => {
    const newPass = prompt(`Introduce la nueva contraseña para ${userEmail}:`);
    if (!newPass) return;

    if (newPass.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      await apiClient.users.updateById(userId, { password: newPass });
      toast({
        title: "Contraseña resteada",
        description: `La contraseña de ${userEmail} ha sido actualizada.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "No se pudo resetear la contraseña.",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tu cuenta, seguridad y preferencias administrativas.
        </p>
      </header>

      <div className="grid gap-8">
        {/* Profile Section */}
        <Card className="overflow-hidden border-none shadow-premium transition-all duration-300 hover:shadow-premium-hover bg-background/50 backdrop-blur-md">
          <CardHeader className="bg-muted/30 pb-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {getInitials(user.full_name || user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{user.full_name || 'Usuario'}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-3 w-3" /> {user.email}
                </CardDescription>
                <div className="pt-1">
                  {user.is_superuser ? (
                    <Badge variant="default" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 px-3 py-1">
                      <ShieldCheck className="h-3 w-3" /> Administrador
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 px-3 py-1">
                      <UserIcon className="h-3 w-3" /> Usuario Estándar
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Nombre Completo
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Tu nombre"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-11 bg-muted/20 border-muted/30 focus:border-primary/50 transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-muted/20 border-muted/30 focus:border-primary/50 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all h-11 px-8 font-semibold rounded-xl"
                >
                  {isUpdatingProfile ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="border-none shadow-premium bg-background/50 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className="bg-muted/30" />
          <CardContent className="pt-6">
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 h-11 bg-muted/20 border-muted/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-11 bg-muted/20 border-muted/30"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isUpdatingPassword}
                  className="h-11 px-8 font-semibold rounded-xl border-muted-foreground/20 hover:bg-muted/30"
                >
                  {isUpdatingPassword ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="mr-2 h-4 w-4" />
                  )}
                  Actualizar Contraseña
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Admin Section */}
        <AnimatePresence>
          {user.is_superuser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Card className="border-none shadow-premium bg-background/50 backdrop-blur-md overflow-hidden">
                <CardHeader className="bg-amber-500/5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-amber-500">Administración de Usuarios</CardTitle>
                      <CardDescription>Visualiza y gestiona otros usuarios del sistema.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <Separator className="bg-amber-500/10" />
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/10 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Usuario</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Rol</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/10">
                        {isLoadingUsers ? (
                          <tr>
                            <td colSpan={4} className="py-20 text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground/30" />
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-20 text-center text-muted-foreground">
                              No hay otros usuarios registrados.
                            </td>
                          </tr>
                        ) : (
                          users.map((u) => (
                            <tr key={u.id} className="group hover:bg-muted/20 transition-colors">
                              <td className="px-6 py-4 font-medium flex items-center gap-3">
                                <Avatar className="h-8 w-8 border border-muted/30">
                                  <AvatarFallback className="text-[10px] bg-muted">
                                    {getInitials(u.full_name || u.email)}
                                  </AvatarFallback>
                                </Avatar>
                                {u.full_name || 'Sin nombre'}
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                              <td className="px-6 py-4">
                                {u.is_superuser ? (
                                  <Badge variant="default" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                                    Admin
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">
                                    Usuario
                                  </Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAdminResetPassword(u.id, u.email)}
                                  className="text-muted-foreground hover:text-primary transition-all rounded-lg h-9"
                                >
                                  <Key className="h-3.5 w-3.5 mr-2" />
                                  Reset Pass
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/5 py-4 flex justify-between items-center px-6">
                  <p className="text-[11px] text-muted-foreground">
                    Total: {users.length} usuarios registrados
                  </p>
                  <Button variant="ghost" size="sm" onClick={fetchUsers} className="h-8 text-[11px] gap-2">
                    <RefreshCcw className="h-3 w-3" />
                    Sincronizar
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
