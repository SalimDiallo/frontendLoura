"use client";

import { Alert, Button, Card } from "@/components/ui";
import { invitationService } from "@/lib/services/hr/invitation.service";
import type { EmployeeAcceptInvitation, EmployeeInvitationVerify } from "@/lib/types/hr";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<EmployeeInvitationVerify | null>(null);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<"verify" | "password" | "profile">("verify");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    address: "",
    city: "",
    country: "",
    emergency_contact: "",
  });

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setLoading(true);
        const data = await invitationService.verify(token);
        setInvitation(data);
        setFormData((prev) => ({
          ...prev,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
        }));
        setStep("password");
      } catch (err: any) {
        setError(err.message || "Invitation invalide ou expirée");
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const handlePasswordSubmit = (password: string, passwordConfirm: string) => {
    setFormData((prev) => ({
      ...prev,
      password,
      password_confirm: passwordConfirm,
    }));
    setStep("profile");
  };

  const handleProfileSubmit = async (profileData: Partial<typeof formData>) => {
    try {
      setSubmitting(true);
      setError("");
      const completeData: EmployeeAcceptInvitation = {
        ...formData,
        ...profileData,
        password: formData.password,
        password_confirm: formData.password_confirm,
        first_name: profileData.first_name || formData.first_name,
        last_name: profileData.last_name || formData.last_name,
      };
      const response = await invitationService.accept(token, completeData);

      // Stocker les tokens
      localStorage.setItem("access_token", response.access);
      localStorage.setItem("refresh_token", response.refresh);
      localStorage.setItem("user_type", "employee");

      // Cas multi-organisation : rediriger vers la page de sélection
      if (response.requires_organization_selection) {
        // Stocker les données temporairement si nécessaire
        if (response.employee) {
          localStorage.setItem("user", JSON.stringify(response.employee));
        }
        // Rediriger vers la page de sélection d'organisation
        router.push("/select-organization");
      } else {
        // Cas normal : une seule organisation, redirection directe
        if (response.employee) {
          localStorage.setItem("user", JSON.stringify(response.employee));
        }
        const orgSubdomain = response.employee?.organization_subdomain || "default";
        router.push(`/apps/${orgSubdomain}/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du compte");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && step === "verify") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Card className="w-full max-w-md p-8 shadow-sm border border-neutral-100">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-400" />
            <p className="text-neutral-700 text-sm">Vérification de l'invitation…</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <Card className="w-full max-w-md p-8 shadow-sm border border-neutral-100">
          <Alert variant="error" className="mb-4">
            <div>
              <h3 className="font-semibold text-base">Invitation invalide</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </Alert>
          <Button className="mt-4 w-full" onClick={() => router.push("/login")}>
            Retour à la connexion
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
            Bienvenue {invitation?.first_name ? `, ${invitation?.first_name}` : ""} 
          </h1>
          <p className="text-neutral-600 text-sm">
            Vous rejoignez <span className="font-semibold">{invitation?.organization_name}</span> comme <span className="font-semibold">{invitation?.role_name}</span>.
          </p>
        </div>
        {error && (
          <Alert variant="error" className="mb-6">
            <p className="text-sm">{error}</p>
          </Alert>
        )}
        <Card className="p-6 shadow-sm border border-neutral-100">
          {step === "password" && (
            <PasswordCreationStep
              email={invitation?.email || ""}
              onSubmit={handlePasswordSubmit}
            />
          )}
          {step === "profile" && (
            <ProfileCompletionStep
              initialData={{
                first_name: formData.first_name,
                last_name: formData.last_name,
              }}
              onSubmit={handleProfileSubmit}
              loading={submitting}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function PasswordCreationStep({
  email,
  onSubmit,
}: {
  email: string;
  onSubmit: (password: string, passwordConfirm: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; passwordConfirm?: string }>({});

  const validatePassword = () => {
    const newErrors: typeof errors = {};
    if (password.length < 8) {
      newErrors.password = "Minimum 8 caractères";
    } else {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
        newErrors.password =
          "Une majuscule, une minuscule, un chiffre et un caractère spécial requis.";
      }
    }
    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "Les mots de passe ne correspondent pas";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePassword()) {
      onSubmit(password, passwordConfirm);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-medium text-neutral-900 mb-1">Définir un mot de passe</h2>
        <p className="text-neutral-500 text-sm">
          Ce compte est lié à <span className="font-semibold">{email}</span>
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Mot de passe
        </label>
        <input
          type="password"
          value={password}
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          required
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">
          Confirmation
        </label>
        <input
          type="password"
          value={passwordConfirm}
          autoComplete="new-password"
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          required
        />
        {errors.passwordConfirm && (
          <p className="mt-1 text-xs text-red-500">{errors.passwordConfirm}</p>
        )}
      </div>
      <div className="text-xs text-neutral-500 mt-2 mb-2">
        <ul className="list-disc pl-5">
          <li>Au moins 8 caractères</li>
          <li>Majuscule, minuscule, chiffre et caractère spécial</li>
        </ul>
      </div>
      <Button type="submit" className="w-full" size="lg">
        Continuer
      </Button>
    </form>
  );
}

function ProfileCompletionStep({
  initialData,
  onSubmit,
  loading,
}: {
  initialData: { first_name: string; last_name: string };
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    first_name: initialData.first_name,
    last_name: initialData.last_name,
    phone: "",
    date_of_birth: "",
    address: "",
    city: "",
    country: "",
    emergency_contact: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-medium text-neutral-900 mb-1">Compléter votre profil</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Prénom</label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Nom</label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-600"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Téléphone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          placeholder="Téléphone"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Date de naissance</label>
        <input
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
          className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-600"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Adresse</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          placeholder="Adresse"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Ville</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Pays</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Contact d'urgence</label>
        <input
          type="text"
          value={formData.emergency_contact}
          onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
          className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-600"
          placeholder="Nom et téléphone"
        />
        
      </div>
      <Button type="submit" className="w-full" size="lg" >
        Créer mon compte
      </Button>
    </form>
  );
}
