# Routing et Navigation

## Vue d'ensemble

Loura Frontend utilise le **Next.js 16 App Router** avec un système de routing **file-based** et **multi-tenant**.

---

## Next.js App Router

### File-based routing

Les routes sont définies par la structure des dossiers dans `app/`.

```
app/
├── page.tsx                  → /
├── about/page.tsx            → /about
└── blog/
    ├── page.tsx              → /blog
    └── [slug]/page.tsx       → /blog/:slug
```

### Route Groups

Organiser sans affecter l'URL.

```
app/
└── (marketing)/
    ├── about/page.tsx        → /about
    └── contact/page.tsx      → /contact
```

### Dynamic Routes

```
app/
└── blog/
    └── [slug]/
        └── page.tsx          → /blog/:slug

// Accès au paramètre
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <div>Post: {params.slug}</div>;
}
```

---

## Structure de routing

### Routes publiques

```
app/
├── page.tsx                  → / (landing)
├── auth/
│   ├── admin/page.tsx        → /auth/admin
│   ├── employee/page.tsx     → /auth/employee
│   └── register/page.tsx     → /auth/register
└── about/page.tsx            → /about
```

### Routes protégées (multi-tenant)

```
app/apps/(org)/[slug]/
├── dashboard/page.tsx        → /apps/:slug/dashboard
├── hr/
│   ├── employees/
│   │   ├── page.tsx          → /apps/:slug/hr/employees
│   │   ├── create/page.tsx   → /apps/:slug/hr/employees/create
│   │   └── [id]/
│   │       ├── page.tsx      → /apps/:slug/hr/employees/:id
│   │       └── edit/page.tsx → /apps/:slug/hr/employees/:id/edit
│   ├── departments/...
│   ├── contracts/...
│   └── payroll/...
├── inventory/
│   ├── products/...
│   ├── sales/...
│   └── warehouses/...
└── notifications/page.tsx    → /apps/:slug/notifications
```

---

## Layouts

### Root Layout

`app/layout.tsx`

Layout principal pour toute l'application.

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Organization Layout

`app/apps/(org)/[slug]/layout.tsx`

Layout pour les routes d'organisation (avec sidebar).

```typescript
export default function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  return (
    <div className="flex h-screen">
      <AppSidebar slug={params.slug} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

### Module Layout

`app/apps/(org)/[slug]/hr/layout.tsx`

Layout pour un module spécifique.

```typescript
export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute code="hr.view_employee">
      <div className="hr-layout">
        {children}
      </div>
    </ProtectedRoute>
  );
}
```

---

## Navigation

### Link

Composant Next.js pour la navigation.

```typescript
import Link from 'next/link';

<Link href="/apps/acme/dashboard">Dashboard</Link>
<Link href={`/apps/${slug}/hr/employees/${id}`}>View Employee</Link>
```

### useRouter

Hook pour la navigation programmatique.

```typescript
'use client';

import { useRouter } from 'next/navigation';

export function MyComponent() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/apps/acme/dashboard');
  };

  const handleBack = () => {
    router.back();
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return <button onClick={handleClick}>Go to Dashboard</button>;
}
```

### useParams

Accès aux paramètres de route.

```typescript
'use client';

import { useParams } from 'next/navigation';

export function MyComponent() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;

  return <div>Organization: {slug}, ID: {id}</div>;
}
```

### usePathname

Accès au pathname actuel.

```typescript
'use client';

import { usePathname } from 'next/navigation';

export function NavItem({ href }: { href: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={isActive ? 'active' : ''}
    >
      Link
    </Link>
  );
}
```

### useSearchParams

Accès aux query parameters.

```typescript
'use client';

import { useSearchParams } from 'next/navigation';

export function MyComponent() {
  const searchParams = useSearchParams();
  const page = searchParams.get('page') || '1';
  const search = searchParams.get('search') || '';

  return <div>Page: {page}, Search: {search}</div>;
}
```

---

## Parallel Routes

Routes parallèles pour afficher plusieurs segments simultanément.

```
app/
└── dashboard/
    ├── @analytics/page.tsx
    ├── @sales/page.tsx
    └── layout.tsx

// layout.tsx
export default function Layout({
  analytics,
  sales,
}: {
  analytics: React.ReactNode;
  sales: React.ReactNode;
}) {
  return (
    <div>
      <div>{analytics}</div>
      <div>{sales}</div>
    </div>
  );
}
```

---

## Intercepting Routes

Intercepter des routes pour afficher des modales.

```
app/
└── photos/
    ├── page.tsx
    ├── [id]/page.tsx
    └── (.)[id]/page.tsx  # Intercepte /photos/[id]
```

---

## Redirection

### redirect()

Server-side redirect.

```typescript
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await getSession();
  
  if (!session) {
    redirect('/auth/admin');
  }

  return <div>Protected content</div>;
}
```

### useRouter().push()

Client-side redirect.

```typescript
const router = useRouter();
router.push('/auth/admin');
```

### permanentRedirect()

Redirection permanente (301).

```typescript
import { permanentRedirect } from 'next/navigation';

permanentRedirect('/new-url');
```

---

## Metadata

### Static Metadata

```typescript
// app/page.tsx
export const metadata = {
  title: 'Home',
  description: 'Welcome to Loura',
};
```

### Dynamic Metadata

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  
  return {
    title: post.title,
    description: post.excerpt,
  };
}
```

---

## Loading States

### loading.tsx

Affichage automatique pendant le chargement.

```
app/
└── dashboard/
    ├── page.tsx
    └── loading.tsx

// loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}
```

### Suspense

Contrôle manuel des loading states.

```typescript
import { Suspense } from 'react';

<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>
```

---

## Error Handling

### error.tsx

Gestionnaire d'erreurs automatique.

```
app/
└── dashboard/
    ├── page.tsx
    └── error.tsx

// error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### not-found.tsx

Page 404 personnalisée.

```
app/
└── not-found.tsx

// not-found.tsx
export default function NotFound() {
  return <div>404 - Page not found</div>;
}
```

---

## Routes API

### Route Handlers

```
app/api/
└── hello/
    └── route.ts

// route.ts
export async function GET(request: Request) {
  return Response.json({ message: 'Hello' });
}

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ received: body });
}
```

---

## Bonnes pratiques

### Routing

1. **File-based** : Utiliser la structure de fichiers
2. **Route groups** : Organiser sans affecter l'URL
3. **Layouts** : Partager l'UI entre routes
4. **Loading/Error** : Gérer les états de chargement et erreurs

### Navigation

1. **Link** : Utiliser `<Link>` pour les liens
2. **useRouter** : Navigation programmatique
3. **Prefetch** : Next.js précharge automatiquement les liens visibles
4. **Shallow routing** : Pour les changements de query params sans recharger

### Multi-tenant

1. **Slug validation** : Valider le slug d'organisation
2. **Redirection** : Rediriger si slug invalide
3. **Cache isolation** : Séparer le cache par slug
4. **Permissions** : Vérifier l'accès à l'organisation

---

## Références

- [Next.js App Router](https://nextjs.org/docs/app)
- [Routing](https://nextjs.org/docs/app/building-your-application/routing)
- [Layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)
- [Navigation](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating)
