export const siteConfig = {
  name: "Loura",
  description: "Plateforme de gestion d'organisations et de ressources humaines",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Navigation principale organisée par module
  nav: {
    // Module Core - Gestion principale
    core: [
      {
        title: "Tableau de bord",
        href: "/core/dashboard",
        icon: "LayoutDashboard"
      },
      {
        title: "Organisations",
        href: "/core/dashboard/organizations",
        icon: "Building2",
        children: [
          {
            title: "Liste des organisations",
            href: "/core/dashboard/organizations"
          },
          {
            title: "Créer une organisation",
            href: "/core/dashboard/organizations/create"
          }
        ]
      },
      {
        title: "Catégories",
        href: "/core/dashboard/categories",
        icon: "Tags"
      },
      {
        title: "Paramètres",
        href: "/core/dashboard/settings",
        icon: "Settings"
      }
    ],

    // Module HR - Ressources Humaines
    hr: [
      {
        title: "Employés",
        href: "/hr/employees",
        icon: "Users",
        children: [
          {
            title: "Liste des employés",
            href: "/hr/employees"
          },
          {
            title: "Ajouter un employé",
            href: "/hr/employees/create"
          }
        ]
      },
      {
        title: "Départements",
        href: "/hr/departments",
        icon: "Building"
      },
      {
        title: "Postes",
        href: "/hr/positions",
        icon: "Briefcase"
      },
      {
        title: "Congés",
        href: "/hr/leaves",
        icon: "Calendar"
      }
    ],

    // Footer
    footer: [
      {
        title: "À propos",
        href: "/about"
      },
      {
        title: "Contact",
        href: "/contact"
      },
      {
        title: "Politique de confidentialité",
        href: "/privacy"
      },
      {
        title: "Conditions d'utilisation",
        href: "/terms"
      }
    ]
  },

  // Routes centralisées d'authentification
  auth: {
    selection: "/auth",        // Page de sélection du type de compte
    admin: "/auth/admin",       // Login administrateur
    employee: "/auth/employee", // Login employé
    logout: "/auth/logout"      // Logout (commun)
  },

  // Routes du module Core
  core: {
    // Authentification (admin seulement - register reste dans core)
    auth: {
      login: "/auth/admin",      // Redirige vers /auth/admin
      register: "/core/register",
      logout: "/auth/logout",
      forgotPassword: "/core/forgot-password",
      resetPassword: "/core/reset-password"
    },
    // Dashboard
    dashboard: {
      home: "/core/dashboard",
      organizations: {
        list: "/core/dashboard/organizations",
        create: "/core/dashboard/organizations/create",
        edit: (id: string) => `/core/dashboard/organizations/${id}/edit`,
        view: (id: string) => `/core/dashboard/organizations/${id}`
      },
      categories: {
        list: "/core/dashboard/categories",
        create: "/core/dashboard/categories/create",
        edit: (id: string) => `/core/dashboard/categories/${id}/edit`
      },
      settings: "/core/dashboard/settings"
    }
  },

  // Routes du module HR
  hr: {
    // Authentification employés
    auth: {
      login: "/auth/employee",    // Redirige vers /auth/employee
      logout: "/auth/logout",
      changePassword: "/hr/change-password"
    },
    employees: {
      list: "/hr/employees",
      create: "/hr/employees/create",
      edit: (id: string) => `/hr/employees/${id}/edit`,
      view: (id: string) => `/hr/employees/${id}`
    },
    departments: {
      list: "/hr/departments",
      create: "/hr/departments/create",
      edit: (id: string) => `/hr/departments/${id}/edit`
    },
    positions: {
      list: "/hr/positions",
      create: "/hr/positions/create",
      edit: (id: string) => `/hr/positions/${id}/edit`
    },
    leaves: {
      list: "/hr/leaves",
      create: "/hr/leaves/create",
      approve: (id: string) => `/hr/leaves/${id}/approve`
    }
  },

  // Informations de contact
  contact: {
    email: "contact@loura.app",
    phone: "+33 1 23 45 67 89",
    address: "Paris, France"
  },

  // Réseaux sociaux
  social: {
    twitter: "https://twitter.com/loura",
    linkedin: "https://linkedin.com/company/loura",
    facebook: "https://facebook.com/loura",
    github: "https://github.com/loura"
  },

  // Métadonnées
  metadata: {
    title: {
      default: "Loura - Gestion d'organisations",
      template: "%s | Loura"
    },
    description: "Plateforme complète de gestion d'organisations et de ressources humaines",
    keywords: ["gestion", "RH", "organisations", "employés", "administration"],
    authors: [{ name: "Loura Team" }],
    creator: "Loura",
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "Loura",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Loura - Gestion d'organisations"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      site: "@loura",
      creator: "@loura"
    }
  },

  // Paramètres de l'application
  app: {
    locale: "fr-FR",
    timezone: "Europe/Paris",
    currency: "EUR",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "HH:mm"
  },

  // Limites et pagination
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 50, 100]
  },

  // Fonctionnalités par module
  features: {
    core: {
      organizations: true,
      categories: true,
      permissions: true,
      analytics: true
    },
    hr: {
      employees: true,
      departments: true,
      positions: true,
      leaves: true,
      payroll: false
    }
  }
} as const;

export type SiteConfig = typeof siteConfig;
