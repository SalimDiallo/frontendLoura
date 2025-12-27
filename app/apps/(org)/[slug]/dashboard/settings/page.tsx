"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Input, Alert, Badge, Label } from "@/components/ui";
import { authService } from "@/lib/services/auth/auth.service";
import type { AdminUser } from "@/lib/types/core";
import {
  User,
  Key,
  Shield,
  Bell,
  Palette,
  Globe,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Lock,
  Trash2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
   const params = useParams();
  const orgSlug = params.slug as string;

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });

  // Active tab
  const [activeTab, setActiveTab] = useState("security");

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (): boolean => {
    if (!passwordData.currentPassword) {
      setPasswordError("Veuillez entrer votre mot de passe actuel");
      return false;
    }
    if (!passwordData.newPassword) {
      setPasswordError("Veuillez entrer un nouveau mot de passe");
      return false;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères");
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return false;
    }
    if (passwordData.newPassword === passwordData.currentPassword) {
      setPasswordError("Le nouveau mot de passe doit être différent de l'ancien");
      return false;
    }
    return true;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!validatePassword()) return;

    try {
      setChangingPassword(true);
      
      // Appel à l'API de changement de mot de passe
      await authService.changePassword({
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirm: passwordData.confirmPassword,
      });
      
      setPasswordSuccess("Mot de passe modifié avec succès !");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      const errorMessage = err.data?.error || err.message || "Erreur lors du changement de mot de passe";
      setPasswordError(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const getPasswordStrength = (password: string): { label: string; color: string; width: string } => {
    if (!password) return { label: "", color: "", width: "0%" };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: "Faible", color: "bg-red-500", width: "33%" };
    if (score <= 4) return { label: "Moyen", color: "bg-yellow-500", width: "66%" };
    return { label: "Fort", color: "bg-green-500", width: "100%" };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  const tabs = [
    { id: "security", label: "Sécurité", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Apparence", icon: Palette },
    { id: "danger", label: "Zone de danger", icon: AlertTriangle },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/apps/${orgSlug}/dashboard/profile`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au profil
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Paramètres du compte</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos préférences et votre sécurité
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <Card className="p-4 lg:col-span-1 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Security Tab */}
          {activeTab === "security" && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Modifier le mot de passe
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                {passwordError && (
                  <Alert variant="error">
                    {passwordError}
                  </Alert>
                )}
                {passwordSuccess && (
                  <Alert variant="success">
                    <CheckCircle className="h-4 w-4" />
                    {passwordSuccess}
                  </Alert>
                )}

                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      className="pl-10 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      className="pl-10 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordData.newPassword && (
                    <div className="space-y-1">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full transition-all", passwordStrength.color)}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Force du mot de passe : <span className="font-medium">{passwordStrength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      className="pl-10 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                  )}
                  {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Les mots de passe correspondent
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Modification en cours...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Changer le mot de passe
                    </>
                  )}
                </Button>
              </form>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Préférences de notifications
              </h3>

              <div className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <h4 className="font-medium">Notifications par email</h4>
                    <p className="text-sm text-muted-foreground">
                      Recevez des notifications importantes par email
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20 transition-colors">
                      <div className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        notifications.email && "translate-x-5"
                      )} />
                    </div>
                  </label>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <h4 className="font-medium">Notifications push</h4>
                    <p className="text-sm text-muted-foreground">
                      Recevez des notifications sur votre navigateur
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.push}
                      onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20 transition-colors">
                      <div className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        notifications.push && "translate-x-5"
                      )} />
                    </div>
                  </label>
                </div>

                {/* SMS Notifications */}
                <div className="flex items-center justify-between p-4 rounded-lg border opacity-50">
                  <div>
                    <h4 className="font-medium">Notifications SMS</h4>
                    <p className="text-sm text-muted-foreground">
                      Recevez des alertes critiques par SMS
                    </p>
                    <Badge variant="secondary" className="mt-2 text-xs">Bientôt disponible</Badge>
                  </div>
                  <label className="relative inline-flex items-center cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={false}
                      disabled
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted rounded-full">
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
                    </div>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Apparence
              </h3>

              <div className="space-y-6">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Les préférences d'apparence (thème clair/sombre) sont gérées globalement via le bouton de basculement dans le header.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <h4 className="font-medium">Langue</h4>
                    <p className="text-sm text-muted-foreground">
                      Sélectionnez votre langue préférée
                    </p>
                  </div>
                  <select className="px-3 py-2 border rounded-lg bg-background text-sm">
                    <option value="fr">Français</option>
                    <option value="en" disabled>English (Bientôt)</option>
                  </select>
                </div>
              </div>
            </Card>
          )}

          {/* Danger Zone Tab */}
          {activeTab === "danger" && (
            <Card className="p-6 border-red-200 dark:border-red-900/50">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Zone de danger
              </h3>

              <div className="space-y-6">
                {/* Deactivate Account */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
                  <div>
                    <h4 className="font-medium text-red-700 dark:text-red-400">Désactiver le compte</h4>
                    <p className="text-sm text-red-600/70 dark:text-red-400/70">
                      Votre compte sera désactivé temporairement. Vous pourrez le réactiver plus tard.
                    </p>
                  </div>
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" disabled>
                    Désactiver
                  </Button>
                </div>

                {/* Delete Account */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
                  <div>
                    <h4 className="font-medium text-red-700 dark:text-red-400">Supprimer le compte</h4>
                    <p className="text-sm text-red-600/70 dark:text-red-400/70">
                      Cette action est irréversible. Toutes vos données seront supprimées définitivement.
                    </p>
                  </div>
                  <Button variant="destructive" disabled>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
