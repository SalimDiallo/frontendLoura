"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Input, Alert, Badge, Label } from "@/components/ui";
import { authService } from "@/lib/services/auth/auth.service";
import type { AdminUser } from "@/lib/types/core";
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  CheckCircle,
  Clock,
  Key,
  Settings,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.slug as string;
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Champs éditables
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setEditData({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        phone: (userData as any).phone || "",
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Appeler l'API de mise à jour du profil
      const updatedUser = await authService.updateProfile({
        first_name: editData.first_name,
        last_name: editData.last_name,
      });
      
      setUser(updatedUser);
      setSuccess("Profil mis à jour avec succès !");
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err.data?.error || err.message || "Erreur lors de la mise à jour";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (user) {
      setEditData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: (user as any).phone || "",
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="p-4">
        <Alert variant="error" title="Erreur">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/apps/${orgSlug}/dashboard`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Mon profil</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos informations personnelles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/apps/${orgSlug}/dashboard/settings`}>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </Button>
          </Link>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={cancelEdit}>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button onClick={handleSaveProfile} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "En cours..." : "Enregistrer"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          {success}
        </Alert>
      )}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Profile Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar & Quick Info */}
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-4xl font-bold text-primary">
                {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                {user?.last_name?.[0] || ""}
              </div>
              <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-background flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="mt-4 text-xl font-semibold">
              {user?.first_name || user?.last_name
                ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                : user?.email || "Utilisateur"}
            </h2>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            <Badge variant="success" className="mt-3">
              <Shield className="mr-1 h-3 w-3" />
              Administrateur
            </Badge>

            {/* Quick Stats */}
            <div className="w-full mt-6 pt-6 border-t space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Membre depuis</span>
                <span className="font-medium">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "short",
                      })
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dernière connexion</span>
                <span className="font-medium">Aujourd'hui</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Statut</span>
                <Badge variant="success" className="h-5 text-xs">Actif</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informations personnelles
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Prénom */}
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom</Label>
              {isEditing ? (
                <Input
                  id="first_name"
                  value={editData.first_name}
                  onChange={(e) =>
                    setEditData({ ...editData, first_name: e.target.value })
                  }
                  placeholder="Votre prénom"
                />
              ) : (
                <p className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md">
                  {user?.first_name || "—"}
                </p>
              )}
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom</Label>
              {isEditing ? (
                <Input
                  id="last_name"
                  value={editData.last_name}
                  onChange={(e) =>
                    setEditData({ ...editData, last_name: e.target.value })
                  }
                  placeholder="Votre nom"
                />
              ) : (
                <p className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md">
                  {user?.last_name || "—"}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">{user?.email || "—"}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                L'email ne peut pas être modifié
              </p>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={editData.phone}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                  placeholder="+33 6 00 00 00 00"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {(user as any)?.phone || "Non renseigné"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Security Section */}
        <Card className="p-6 lg:col-span-3">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Sécurité
          </h3>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Mot de passe */}
            <div className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Mot de passe</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dernière modification il y a 30 jours
                  </p>
                  <Link href={`/apps/${orgSlug}/dashboard/profile`}>
                    <Button variant="outline" size="sm" className="mt-3">
                      Modifier
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Authentification 2FA */}
            <div className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Shield className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Authentification 2FA</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Non activée
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" disabled>
                    Bientôt disponible
                  </Button>
                </div>
              </div>
            </div>

            {/* Sessions actives */}
            <div className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Clock className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Sessions actives</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    1 session active
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" disabled>
                    Gérer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
