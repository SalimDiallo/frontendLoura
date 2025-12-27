# Guide d'utilisation des formulaires

Ce guide explique comment utiliser le système de formulaires avec React Hook Form et Zod.

## Composants disponibles

### Composants de base
- `Form` - Provider principal du formulaire
- `FormField` - Champ de formulaire contrôlé
- `FormItem` - Conteneur pour un champ
- `FormLabel` - Label du champ
- `FormControl` - Wrapper pour le contrôle d'input
- `FormDescription` - Description optionnelle
- `FormMessage` - Message d'erreur

### Composants utilitaires (recommandés)
- `FormInputField` - Champ de texte générique
- `FormEmailField` - Champ email avec validation
- `FormPasswordField` - Champ mot de passe
- `FormTextareaField` - Zone de texte multilignes
- `FormNumberField` - Champ numérique
- `FormDateField` - Champ date

## Hook personnalisé

`useZodForm` - Simplifie la création de formulaires avec Zod

## Exemple complet

```tsx
"use client";

import { z } from "zod";
import { useZodForm } from "@/lib/hooks";
import {
  Form,
  FormInputField,
  FormEmailField,
  FormPasswordField,
  FormTextareaField,
  Button,
} from "@/components/ui";

// 1. Définir le schéma de validation Zod
const registerSchema = z.object({
  organization_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  email: z
    .string()
    .email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  description: z
    .string()
    .optional(),
});

// 2. Inférer le type depuis le schéma
type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  // 3. Initialiser le formulaire avec le hook
  const form = useZodForm({
    schema: registerSchema,
    defaultValues: {
      organization_name: "",
      email: "",
      password: "",
      description: "",
    },
  });

  // 4. Définir la fonction de soumission
  const onSubmit = form.handleSubmit(async (data: RegisterFormData) => {
    try {
      // Les données sont automatiquement validées et typées
      console.log(data);

      // Appeler votre API
      // await authService.register(data);

    } catch (error) {
      console.error("Erreur:", error);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Champ texte simple */}
        <FormInputField
          name="organization_name"
          label="Nom de l'organisation"
          placeholder="Acme Inc."
          required
        />

        {/* Champ email avec validation */}
        <FormEmailField
          name="email"
          label="Adresse email"
          placeholder="contact@example.com"
          required
        />

        {/* Champ mot de passe */}
        <FormPasswordField
          name="password"
          label="Mot de passe"
          description="Minimum 8 caractères"
          required
        />

        {/* Zone de texte optionnelle */}
        <FormTextareaField
          name="description"
          label="Description"
          placeholder="Décrivez votre organisation..."
          rows={4}
        />

        {/* Bouton de soumission */}
        <Button
          type="submit"
          className="w-full"
          loading={form.formState.isSubmitting}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Inscription..." : "S'inscrire"}
        </Button>
      </form>
    </Form>
  );
}
```

## Exemple avec gestion d'erreurs API

```tsx
"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useZodForm } from "@/lib/hooks";
import { authService } from "@/lib/services/core";
import {
  Form,
  FormEmailField,
  FormPasswordField,
  Button,
  Alert,
} from "@/components/ui";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useZodForm({
    schema: loginSchema,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data: LoginFormData) => {
    try {
      setError(null);
      await authService.login(data);
      router.push("/core/dashboard");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la connexion");
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Affichage des erreurs API */}
        {error && (
          <Alert variant="destructive">
            {error}
          </Alert>
        )}

        <FormEmailField
          name="email"
          label="Email"
          placeholder="votre@email.com"
          required
        />

        <FormPasswordField
          name="password"
          label="Mot de passe"
          required
        />

        <Button
          type="submit"
          className="w-full"
          loading={form.formState.isSubmitting}
        >
          Se connecter
        </Button>
      </form>
    </Form>
  );
}
```

## Validation personnalisée

```tsx
const schema = z.object({
  email: z
    .string()
    .email("Email invalide")
    .refine(
      (email) => email.endsWith("@company.com"),
      "L'email doit être du domaine @company.com"
    ),

  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Doit contenir une majuscule")
    .regex(/[0-9]/, "Doit contenir un chiffre"),

  age: z
    .number()
    .min(18, "Vous devez avoir au moins 18 ans")
    .max(120, "Âge invalide"),
});
```

## Réinitialiser le formulaire

```tsx
// Réinitialiser avec les valeurs par défaut
form.reset();

// Réinitialiser avec de nouvelles valeurs
form.reset({
  email: "nouveau@email.com",
  password: "",
});
```

## Définir des erreurs manuellement

```tsx
// Définir une erreur sur un champ spécifique
form.setError("email", {
  type: "manual",
  message: "Cet email est déjà utilisé",
});

// Définir une erreur globale
form.setError("root", {
  type: "manual",
  message: "Erreur de connexion au serveur",
});
```

## Accéder aux valeurs du formulaire

```tsx
// Valeur actuelle d'un champ
const emailValue = form.watch("email");

// Toutes les valeurs
const allValues = form.getValues();

// Vérifier si le formulaire a été modifié
const isDirty = form.formState.isDirty;

// Vérifier si un champ spécifique a été modifié
const isEmailDirty = form.formState.dirtyFields.email;
```

## Bonnes pratiques

1. **Toujours définir un schéma Zod** pour la validation
2. **Utiliser les composants utilitaires** (`FormInputField`, etc.) pour simplifier le code
3. **Gérer les états de chargement** avec `form.formState.isSubmitting`
4. **Afficher les erreurs API** dans une `Alert` au-dessus du formulaire
5. **Utiliser `required`** dans les props pour l'accessibilité et l'indicateur visuel (*)
6. **Ajouter des descriptions** pour guider l'utilisateur
7. **Réinitialiser le formulaire** après une soumission réussie si nécessaire

## Types disponibles

Tous les composants sont entièrement typés avec TypeScript. Les types sont inférés automatiquement depuis votre schéma Zod.

```tsx
// Le type est inféré automatiquement
type FormData = z.infer<typeof yourSchema>;

// TypeScript vérifie les noms des champs
<FormInputField name="email" /> // ✓ OK
<FormInputField name="invalid" /> // ✗ Erreur TypeScript
```
