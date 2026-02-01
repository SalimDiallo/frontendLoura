"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button, Card, Input, Alert, Badge, Label } from "@/components/ui";
import { authService, UnifiedUser } from "@/lib/services/auth/auth.service";
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
  Briefcase,
  Award,
  Map
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const params = useParams();
  const orgSlug = params.slug as string;
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState<string | null>(null);

  // Champs strictement éditables
  const [editData, setEditData] = useState<any>({
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    address: "",
    city: "",
    country: "",
    emergency_contact: { name: "", phone: "", relationship: "" },
  });

  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.getCurrentUser();
      const userData = response;
      setUser(userData);
      setEditData({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        phone: userData.phone || "",
        date_of_birth: userData.date_of_birth || "",
        address: userData.address || "",
        city: userData.city || "",
        country: userData.country || "",
        emergency_contact: {
          name: userData.emergency_contact?.name || "",
          phone: userData.emergency_contact?.phone || "",
          relationship: userData.emergency_contact?.relationship || "",
        },
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

      // Création de l'objet updateData avec exclusivement les champs autorisés
      const updateData: any = {
        first_name: editData.first_name,
        last_name: editData.last_name,
        phone: editData.phone,
        date_of_birth: editData.date_of_birth,
        address: editData.address,
        city: editData.city,
        country: editData.country,
        emergency_contact: {
          name: editData.emergency_contact?.name || "",
          phone: editData.emergency_contact?.phone || "",
          relationship: editData.emergency_contact?.relationship || "",
        },
      };

      // Suppression de l'objet emergency_contact si tous les champs sont vides
      if (
        !updateData.emergency_contact.name &&
        !updateData.emergency_contact.phone &&
        !updateData.emergency_contact.relationship
      ) {
        delete updateData.emergency_contact;
      }

      // Appeler l'API de mise à jour du profil
      const updatedUser = await authService.updateProfile(updateData);

      setUser(updatedUser as UnifiedUser);
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
        phone: user.phone || "",
        date_of_birth: user.date_of_birth || "",
        address: user.address || "",
        city: user.city || "",
        country: user.country || "",
        emergency_contact: {
          name: user.emergency_contact?.name || "",
          phone: user.emergency_contact?.phone || "",
          relationship: user.emergency_contact?.relationship || "",
        },
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

  // Helper pour afficher un champ info (label + valeur)
  function InfoField({ label, value }: { label: string; value?: any }) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <p className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md">
          {value || "—"}
        </p>
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
              <div className="w-32 h-32 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center text-4xl font-bold text-primary">
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
            {
              user?.user_type == "admin" ? (
                <Badge variant="success" className="mt-3">
                  <Shield className="mr-1 h-3 w-3" />
                  Administrateur
                </Badge>
              ) : (
                <Badge variant="success" className="mt-3">
                  <User className="mr-1 h-3 w-3" />
                  Utilisateur
                </Badge>
              )
            }

            {/* Quick Stats */}
            <div className="w-full mt-6 pt-6 border-t space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Membre depuis</span>
                <span className="font-medium">
                  {user?.created_at && formatDate(user?.created_at)}
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
              {/* Informations supplémentaires issues de UnifiedUser */}
              {user?.user_type === "admin" && user.organizations && user.organizations.length > 0 && (
                <div className="flex flex-col gap-1 mt-3 border-t pt-3">
                  <span className="text-muted-foreground text-xs font-semibold">
                    Organisations&nbsp;:
                  </span>
                  {user.organizations.map((org) => (
                    <div key={org.id} className="flex items-center gap-2 ml-1">
                      {org.logo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="w-6 h-6 rounded-full object-cover border border-muted"
                        />
                      )}
                      <span className="font-medium text-sm">{org.name}</span>
                      {org.is_active ? (
                        <Badge variant="success" className="h-5 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="error" className="h-5 text-xs">Inactive</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {user?.user_type === 'employee' && user.organization && (
                <div className="flex flex-col gap-1 mt-3 border-t pt-3">
                  <span className="text-muted-foreground text-xs font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> Organisation :
                  </span>
                  <div className="flex items-center gap-2 ml-1">
                    {user.organization.logo_url &&
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.organization.logo_url}
                        alt={user.organization.name}
                        className="w-6 h-6 rounded-full object-cover border border-muted"
                      />
                    }
                    <span className="font-medium text-sm">{user.organization.name}</span>
                  </div>
                </div>
              )}
              {(user?.department || user?.position) && (
                <div className="flex flex-col gap-1 mt-3 border-t pt-3">
                  {user.department && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground">Département :</span>
                      <span className="font-medium text-sm">{user.department.name}</span>
                    </div>
                  )}
                  {user.position && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground">Poste :</span>
                      <span className="font-medium text-sm">{user.position.title}</span>
                    </div>
                  )}
                </div>
              )}
              {user?.employment_status && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">Statut d'emploi&nbsp;:</span>
                  <Badge variant="outline" className="h-5 text-xs">{user.employment_status}</Badge>
                </div>
              )}
              {/* Affichage du rôle */}
              {user?.role && (
                <div className="flex items-center gap-2 mt-2">
                  <Award className="h-4 w-4 text-accent-foreground" />
                  <span className="text-xs text-muted-foreground">Rôle :</span>
                  <Badge variant="secondary" className="h-5 text-xs font-semibold">
                    {typeof user.role == 'object' ? user.role?.name : user.role}
                  </Badge>
                </div>
              )}
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
                  onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                  placeholder="Votre prénom"
                  autoComplete="off"
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
                  onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                  placeholder="Votre nom"
                  autoComplete="off"
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
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="+33 6 00 00 00 00"
                  autoComplete="off"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {user?.phone || "Non renseigné"}
                  </p>
                </div>
              )}
            </div>

            {/* Date de naissance */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date de naissance</Label>
              {isEditing ? (
                <Input
                  id="date_of_birth"
                  type="date"
                  value={editData.date_of_birth ? editData.date_of_birth.substring(0, 10) : ""}
                  onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                  placeholder="Date de naissance"
                  autoComplete="off"
                />
              ) : (
                <p className="text-sm font-medium py-2 px-3 bg-muted/50 rounded-md">
                  {user?.date_of_birth ? formatDate(user.date_of_birth) : "—"}
                </p>
              )}
            </div>

            {/* Adresse */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  placeholder="Votre adresse"
                  autoComplete="off"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Map className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {user?.address || "—"}
                  </p>
                </div>
              )}
            </div>

            {/* Ville */}
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              {isEditing ? (
                <Input
                  id="city"
                  value={editData.city}
                  onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                  placeholder="Votre ville"
                  autoComplete="off"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Map className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {user?.city || "—"}
                  </p>
                </div>
              )}
            </div>

            {/* Pays */}
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              {isEditing ? (
                <Input
                  id="country"
                  value={editData.country}
                  onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                  placeholder="France"
                  autoComplete="off"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Map className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {user?.country || "—"}
                  </p>
                </div>
              )}
            </div>

            {/* Contact d'urgence */}
            <div className="space-y-2">
              <Label>Contact d'urgence</Label>
              {isEditing ? (
                <>
                  <Input
                    id="emergency_contact_name"
                    value={editData.emergency_contact?.name || ""}
                    onChange={(e) => setEditData({
                      ...editData,
                      emergency_contact: { ...editData.emergency_contact, name: e.target.value }
                    })}
                    placeholder="Nom du contact"
                    className="mb-2"
                  />
                  <Input
                    id="emergency_contact_phone"
                    value={editData.emergency_contact?.phone || ""}
                    onChange={(e) => setEditData({
                      ...editData,
                      emergency_contact: { ...editData.emergency_contact, phone: e.target.value }
                    })}
                    placeholder="Téléphone du contact"
                    className="mb-2"
                  />
                  <Input
                    id="emergency_contact_relationship"
                    value={editData.emergency_contact?.relationship || ""}
                    onChange={(e) => setEditData({
                      ...editData,
                      emergency_contact: { ...editData.emergency_contact, relationship: e.target.value }
                    })}
                    placeholder="Lien (ami, parent, ...)"
                  />
                </>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Nom :</span>
                    <span className="font-medium">
                      {user?.emergency_contact?.name || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Téléphone :</span>
                    <span className="font-medium">
                      {user?.emergency_contact?.phone || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Lien :</span>
                    <span className="font-medium">
                      {user?.emergency_contact?.relationship || "—"}
                    </span>
                  </div>
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
            <div className="p-4 rounded-lg border transition-colors">
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-primary mt-1" />
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
            <div className="p-4 rounded-lg border transition-colors">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-orange-500 mt-1" />
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
            <div className="p-4 rounded-lg border transition-colors">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-green-500 mt-1" />
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
        {/* Map Section */}
        <Card className="p-6 lg:col-span-3">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Localisation
          </h3>
          <div className="w-full h-72 overflow-hidden rounded-lg">
            {user?.address || user?.city || user?.country ? (
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                referrerPolicy="no-referrer-when-downgrade"
                src={
                  "https://www.google.com/maps?q=" +
                  encodeURIComponent(
                    [
                      user.address,
                      user.city,
                      user.country
                    ]
                      .filter(Boolean)
                      .join(", ")
                  ) +
                  "&output=embed"
                }
                allowFullScreen
                aria-hidden="false"
                tabIndex={0}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Aucune adresse renseignée pour afficher la carte.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
