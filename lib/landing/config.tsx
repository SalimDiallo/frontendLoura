"use client";

import { FirstBentoAnimation } from "@/components/landing/first-bento-animation";
import { FourthBentoAnimation } from "@/components/landing/fourth-bento-animation";
import { SecondBentoAnimation } from "@/components/landing/second-bento-animation";
import { ThirdBentoAnimation } from "@/components/landing/third-bento-animation";
import { FlickeringGrid } from "@/components/landing/ui/flickering-grid";
import { Globe } from "@/components/landing/ui/globe";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        "p-1 py-0.5 font-medium dark:font-semibold text-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
};

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "Louratech",
  description: "La plateforme SaaS tout-en-un de gestion d'agence avec modules RH, Stocks, Services, Projets, CRM et plus.",
  cta: "Commencer",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  keywords: [
    "SaaS Gestion d'agence",
    "Ressources humaines",
    "Gestion des stocks",
    "Suivi des services",
    "Gestion de projet",
    "CRM",
    "Logiciel agence",
    "Louratech",
    "Productivité entreprise"
  ],
  links: {
    email: "support@louratech.com",
    twitter: "https://twitter.com/louratech",
    discord: "https://discord.gg/louratech",
    github: "https://github.com/louratech",
    instagram: "https://instagram.com/louratech",
  },
  nav: {
    links: [
      { id: 1, name: "Accueil", href: "#hero" },
      { id: 2, name: "Modules", href: "#modules" },
      { id: 3, name: "Fonctionnalités", href: "#features" },
      { id: 4, name: "Tarifs", href: "#pricing" },
    ],
  },
  hero: {
    badgeIcon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="dark:fill-white fill-[#364153]"
      >
        <path d="M7.62758 1.09876C7.74088 1.03404 7.8691 1 7.99958 1C8.13006 1 8.25828 1.03404 8.37158 1.09876L13.6216 4.09876C13.7363 4.16438 13.8316 4.25915 13.8979 4.37347C13.9642 4.48779 13.9992 4.6176 13.9992 4.74976C13.9992 4.88191 13.9642 5.01172 13.8979 5.12604C13.8316 5.24036 13.7363 5.33513 13.6216 5.40076L8.37158 8.40076C8.25828 8.46548 8.13006 8.49952 7.99958 8.49952C7.8691 8.49952 7.74088 8.46548 7.62758 8.40076L2.37758 5.40076C2.26287 5.33513 2.16753 5.24036 2.10123 5.12604C2.03492 5.01172 2 4.88191 2 4.74976C2 4.6176 2.03492 4.48779 2.10123 4.37347C2.16753 4.25915 2.26287 4.16438 2.37758 4.09876L7.62758 1.09876Z" />
        <path d="M2.56958 7.23928L2.37758 7.34928C2.26287 7.41491 2.16753 7.50968 2.10123 7.624C2.03492 7.73831 2 7.86813 2 8.00028C2 8.13244 2.03492 8.26225 2.10123 8.37657C2.16753 8.49089 2.26287 8.58566 2.37758 8.65128L7.62758 11.6513C7.74088 11.716 7.8691 11.75 7.99958 11.75C8.13006 11.75 8.25828 11.716 8.37158 11.6513L13.6216 8.65128C13.7365 8.58573 13.8321 8.49093 13.8986 8.3765C13.965 8.26208 14 8.13211 14 7.99978C14 7.86745 13.965 7.73748 13.8986 7.62306C13.8321 7.50864 13.7365 7.41384 13.6216 7.34828L13.4296 7.23828L9.11558 9.70328C8.77568 9.89744 8.39102 9.99956 7.99958 9.99956C7.60814 9.99956 7.22347 9.89744 6.88358 9.70328L2.56958 7.23928Z" />
        <path d="M2.37845 10.5993L2.57045 10.4893L6.88445 12.9533C7.22435 13.1474 7.60901 13.2496 8.00045 13.2496C8.39189 13.2496 8.77656 13.1474 9.11645 12.9533L13.4305 10.4883L13.6225 10.5983C13.7374 10.6638 13.833 10.7586 13.8994 10.8731C13.9659 10.9875 14.0009 11.1175 14.0009 11.2498C14.0009 11.3821 13.9659 11.5121 13.8994 11.6265C13.833 11.7409 13.7374 11.8357 13.6225 11.9013L8.37245 14.9013C8.25915 14.966 8.13093 15 8.00045 15C7.86997 15 7.74175 14.966 7.62845 14.9013L2.37845 11.9013C2.2635 11.8357 2.16795 11.7409 2.10148 11.6265C2.03501 11.5121 2 11.3821 2 11.2498C2 11.1175 2.03501 10.9875 2.10148 10.8731C2.16795 10.7586 2.2635 10.6638 2.37845 10.5983V10.5993Z" />
      </svg>
    ),
    badge: "Découvrez la gestion intelligente d'agence",
    title: "Louratech : Centralisez et pilotez tous vos modules",
    description:
      "Louratech est une solution SaaS pour digitaliser et optimiser la gestion des entreprises, avec des modules intégrés : RH, Stocks, Services, Projets, CRM, et bien plus.",
    cta: {
      primary: {
        text: "Essayez gratuitement",
        href: "/core/register",
      },
      secondary: {
        text: "Se connecter",
        href: "/auth",
      },
    },
  },
  companyShowcase: {
    companyLogos: [
      {
        id: 1,
        name: "Company 1",
        logo: (
        <Image src="/images/company-1.png" alt="Company 1" width={110} height={31} />
        ),
      },  
      {
        id: 2,name: "Company 2",
        logo: (
          <Image src="/images/company-2.png" alt="Company 2" width={113} height={25} />
        ),
      },
      {
        id: 3,
        name: "Company 3",
        logo: (
          <Image src="/images/company-3.png" alt="Company 3" width={73} height={31} />
        ),
      },
      {
        id: 4,
        name: "Company 4",
        logo: (
          <Image src="/images/company-4.png" alt="Company 4" width={96} height={23} />
        ),
      },
      {
        id: 5,
        name: "Company 5",
        logo: (
          <Image src="/images/company-5.png" alt="Company 5" width={99} height={31} />
        ),
      },
      {
        id: 6,
        name: "Company 6",
        logo: (
          <Image src="/images/company-6.png" alt="Company 6" width={132} height={21} />
        ),
      },
    ],
  },
  featureSection: {
    title: "Simple. Centralisé. Puissant.",
    description:
      "Découvrez comment Louratech simplifie la gestion de votre agence en quelques étapes, quelque soit votre module : RH, Stocks, Services, et plus.",
    items: [
      {
        id: 1,
        title: "Choisissez votre module (RH, Stock, Services...)",
        content:
          "Sélectionnez le domaine de gestion souhaité. Louratech regroupe tous vos modules dans un même espace pour une navigation fluide, adaptée à la gestion d’agence moderne.",
        image:
          "https://images.pexels.com/photos/6801642/pexels-photo-6801642.jpeg?auto=compress&w=800&fit=crop", // gestion d'équipe/module symbolique
      },
      {
        id: 2,
        title: "Saisissez ou exprimez votre requête",
        content:
          "Demandez une action (ex: enregistrer un nouveau collaborateur, consulter l’état des stocks, générer un rapport de mission). Louratech comprend vos besoins et lance automatiquement la procédure adaptée.",
        image:
          "https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&w=800&fit=crop", // input ou requête IA/logiciel
      },
      {
        id: 3,
        title: "Obtenez des résultats immédiats et actionnables",
        content:
          "Visualisez instantanément les réponses, rapports, ou actions réalisées dans le module choisi. Les modules travaillent de concert pour que vos données soient toujours à jour et cohérentes.",
        image:
          "https://images.pexels.com/photos/6693651/pexels-photo-6693651.jpeg?auto=compress&w=800&fit=crop", // dashboard, résultats, analytics visibles
      },
      {
        id: 4,
        title: "Amélioration continue adaptée à votre agence",
        content:
          "Louratech évolue avec vos besoins : nous enrichissons en permanence les modules RH, Stocks, Services et plus, afin de simplifier encore la gestion de votre agence.",
        image:
          "https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&w=800&fit=crop", // innovation, croissance, évolution
      },
    ],
  },
  bentoSection: {
    title: "Accélérez la gestion de votre agence avec l’IA Louratech",
    description:
      "Collaborez en temps réel, connectez tous vos modules (RH, Stocks, Services...) et profitez de rapports intelligents pour optimiser vos opérations d’agence.",
    items: [
      {
        id: 1,
        content: <FirstBentoAnimation />,
        title: "Collaboration en temps réel",
        description:
          "Coordonnez vos équipes, suivez les demandes, affectez ou transférez des missions : tout se fait en temps réel dans vos modules Louratech.",
      },
      {
        id: 2,
        content: <SecondBentoAnimation />,
        title: "Modules interconnectés",
        description:
          "Synchronisez vos RH, Stocks, Services, Interventions et Comptabilité pour une gestion centralisée et automatisée de toute l’agence.",
      },
      {
        id: 3,
        content: (
          <ThirdBentoAnimation
            data={[20, 30, 25, 45, 40, 55, 75]}
            toolTipValues={[
              1234, 1678, 2101, 2534, 2967, 3400, 3833, 4266, 4700, 5133,
            ]}
          />
        ),
        title: "Rapports et tableaux de bord intelligents",
        description:
          "Visualisez l’ensemble de vos indicateurs d’agence (absentéisme, niveau de stocks, taux de service…) grâce à des rapports IA personnalisés et mis à jour en continu.",
      },
      {
        id: 4,
        content: <FourthBentoAnimation once={false} />,
        title: "Automatisation du quotidien",
        description:
          "Automatisez les tâches répétitives : pointages, relances clients, alertes de stocks... et consacrez plus de temps à l’innovation, au développement, et au service client.",
      },
    ],
  },
  benefits: [
    {
      id: 1,
      text: "Gagnez des heures chaque semaine grâce à l’automatisation des plannings et tâches de gestion.",
      image: "/Device-6.png",
    },
    {
      id: 2,
      text: "Réduisez les erreurs et les doublons dans la saisie et la planification de vos ressources.",
      image: "/Device-7.png",
    },
    {
      id: 3,
      text: "Favorisez l’équilibre et la satisfaction de vos équipes par une gestion intelligente du temps et des missions.",
      image: "/Device-8.png",
    },
    {
      id: 4,
      text: "Augmentez la productivité de toute l’agence avec la vision centralisée et les alertes automatisées de Louratech.",
      image: "/Device-1.png",
    },
  ],
  growthSection: {
      title: "Conçu pour la croissance sécurisée",
      description:
        "Où la sécurité avancée rencontre la scalabilité sans interruption - conçu pour protéger vos données et vous aider à croître.",
      items: [
      {
        id: 1,
        content: (
          <div
            className="relative flex size-full items-center justify-center overflow-hidden transition-all duration-300 hover:[mask-image:none] hover:[webkit-mask-image:none]"
            style={{
              WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='265' height='268' viewBox='0 0 265 268' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='M121.384 4.5393C124.406 1.99342 128.319 0.585938 132.374 0.585938C136.429 0.585938 140.342 1.99342 143.365 4.5393C173.074 29.6304 210.174 45.6338 249.754 50.4314C253.64 50.9018 257.221 52.6601 259.855 55.3912C262.489 58.1223 264.005 61.6477 264.13 65.3354C265.616 106.338 254.748 146.9 232.782 182.329C210.816 217.759 178.649 246.61 140.002 265.547C137.645 266.701 135.028 267.301 132.371 267.298C129.715 267.294 127.1 266.686 124.747 265.526C86.0991 246.59 53.9325 217.739 31.9665 182.309C10.0005 146.879 -0.867679 106.317 0.618784 65.3147C0.748654 61.6306 2.26627 58.1102 4.9001 55.3833C7.53394 52.6565 11.1121 50.9012 14.9945 50.4314C54.572 45.6396 91.6716 29.6435 121.384 4.56V4.5393Z' fill='black'/%3E%3C/svg%3E")`,
              maskImage: `url("data:image/svg+xml,%3Csvg width='265' height='268' viewBox='0 0 265 268' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='M121.384 4.5393C124.406 1.99342 128.319 0.585938 132.374 0.585938C136.429 0.585938 140.342 1.99342 143.365 4.5393C173.074 29.6304 210.174 45.6338 249.754 50.4314C253.64 50.9018 257.221 52.6601 259.855 55.3912C262.489 58.1223 264.005 61.6477 264.13 65.3354C265.616 106.338 254.748 146.9 232.782 182.329C210.816 217.759 178.649 246.61 140.002 265.547C137.645 266.701 135.028 267.301 132.371 267.298C129.715 267.294 127.1 266.686 124.747 265.526C86.0991 246.59 53.9325 217.739 31.9665 182.309C10.0005 146.879 -0.867679 106.317 0.618784 65.3147C0.748654 61.6306 2.26627 58.1102 4.9001 55.3833C7.53394 52.6565 11.1121 50.9012 14.9945 50.4314C54.572 45.6396 91.6716 29.6435 121.384 4.56V4.5393Z' fill='black'/%3E%3C/svg%3E")`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
            }}
          >
            <div className="absolute top-[55%] md:top-[58%] left-[55%] md:left-[57%] -translate-x-1/2 -translate-y-1/2  size-full z-10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="227"
                height="244"
                viewBox="0 0 227 244"
                fill="none"
                className="size-[90%] md:size-[85%] object-contain fill-background"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M104.06 3.61671C106.656 1.28763 110.017 0 113.5 0C116.983 0 120.344 1.28763 122.94 3.61671C148.459 26.5711 180.325 41.2118 214.322 45.6008C217.66 46.0312 220.736 47.6398 222.999 50.1383C225.262 52.6369 226.563 55.862 226.67 59.2357C227.947 96.7468 218.612 133.854 199.744 166.267C180.877 198.68 153.248 225.074 120.052 242.398C118.028 243.454 115.779 244.003 113.498 244C111.216 243.997 108.969 243.441 106.948 242.379C73.7524 225.055 46.1231 198.661 27.2556 166.248C8.38807 133.835 -0.947042 96.7279 0.329744 59.2168C0.441295 55.8464 1.74484 52.6258 4.00715 50.1311C6.26946 47.6365 9.34293 46.0306 12.6777 45.6008C46.6725 41.2171 78.5389 26.5832 104.06 3.63565V3.61671Z"
                />
              </svg>
            </div>
            <div className="absolute top-[58%] md:top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2  size-full z-20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="245"
                height="282"
                viewBox="0 0 245 282"
                className="size-full object-contain fill-accent"
              >
                <g filter="url(#filter0_dddd_2_33)">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M113.664 7.33065C116.025 5.21236 119.082 4.04126 122.25 4.04126C125.418 4.04126 128.475 5.21236 130.836 7.33065C154.045 28.2076 183.028 41.5233 213.948 45.5151C216.984 45.9065 219.781 47.3695 221.839 49.6419C223.897 51.9144 225.081 54.8476 225.178 57.916C226.339 92.0322 217.849 125.781 200.689 155.261C183.529 184.74 158.4 208.746 128.209 224.501C126.368 225.462 124.323 225.962 122.248 225.959C120.173 225.956 118.13 225.45 116.291 224.484C86.0997 208.728 60.971 184.723 43.811 155.244C26.6511 125.764 18.1608 92.015 19.322 57.8988C19.4235 54.8334 20.6091 51.9043 22.6666 49.6354C24.7242 47.3665 27.5195 45.906 30.5524 45.5151C61.4706 41.5281 90.4531 28.2186 113.664 7.34787V7.33065Z"
                  />
                </g>
                <defs>
                  <filter
                    id="filter0_dddd_2_33"
                    x="0.217041"
                    y="0.0412598"
                    width="244.066"
                    height="292.917"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="3" />
                    <feGaussianBlur stdDeviation="3.5" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_2_33"
                    />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="12" />
                    <feGaussianBlur stdDeviation="6" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="effect1_dropShadow_2_33"
                      result="effect2_dropShadow_2_33"
                    />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="27" />
                    <feGaussianBlur stdDeviation="8" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.02 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="effect2_dropShadow_2_33"
                      result="effect3_dropShadow_2_33"
                    />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="48" />
                    <feGaussianBlur stdDeviation="9.5" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.01 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="effect3_dropShadow_2_33"
                      result="effect4_dropShadow_2_33"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect4_dropShadow_2_33"
                      result="shape"
                    />
                  </filter>
                </defs>
              </svg>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="81"
                height="80"
                viewBox="0 0 81 80"
                className="fill-background"
              >
                <g filter="url(#filter0_iiii_2_34)">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M20.5 36V28C20.5 22.6957 22.6071 17.6086 26.3579 13.8579C30.1086 10.1071 35.1957 8 40.5 8C45.8043 8 50.8914 10.1071 54.6421 13.8579C58.3929 17.6086 60.5 22.6957 60.5 28V36C62.6217 36 64.6566 36.8429 66.1569 38.3431C67.6571 39.8434 68.5 41.8783 68.5 44V64C68.5 66.1217 67.6571 68.1566 66.1569 69.6569C64.6566 71.1571 62.6217 72 60.5 72H20.5C18.3783 72 16.3434 71.1571 14.8431 69.6569C13.3429 68.1566 12.5 66.1217 12.5 64V44C12.5 41.8783 13.3429 39.8434 14.8431 38.3431C16.3434 36.8429 18.3783 36 20.5 36ZM52.5 28V36H28.5V28C28.5 24.8174 29.7643 21.7652 32.0147 19.5147C34.2652 17.2643 37.3174 16 40.5 16C43.6826 16 46.7348 17.2643 48.9853 19.5147C51.2357 21.7652 52.5 24.8174 52.5 28Z"
                  />
                </g>
                <defs>
                  <filter
                    id="filter0_iiii_2_34"
                    x="12.5"
                    y="8"
                    width="56"
                    height="70"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="BackgroundImageFix"
                      result="shape"
                    />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="1" />
                    <feGaussianBlur stdDeviation="1" />
                    <feComposite
                      in2="hardAlpha"
                      operator="arithmetic"
                      k2="-1"
                      k3="1"
                    />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="shape"
                      result="effect1_innerShadow_2_34"
                    />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="3" />
                    <feGaussianBlur stdDeviation="1.5" />
                    <feComposite
                      in2="hardAlpha"
                      operator="arithmetic"
                      k2="-1"
                      k3="1"
                    />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.09 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="effect1_innerShadow_2_34"
                      result="effect2_innerShadow_2_34"
                    />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="8" />
                    <feGaussianBlur stdDeviation="2.5" />
                    <feComposite
                      in2="hardAlpha"
                      operator="arithmetic"
                      k2="-1"
                      k3="1"
                    />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="effect2_innerShadow_2_34"
                      result="effect3_innerShadow_2_34"
                    />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="14" />
                    <feGaussianBlur stdDeviation="3" />
                    <feComposite
                      in2="hardAlpha"
                      operator="arithmetic"
                      k2="-1"
                      k3="1"
                    />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.01 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="effect3_innerShadow_2_34"
                      result="effect4_innerShadow_2_34"
                    />
                  </filter>
                </defs>
              </svg>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="size-full"
            >
              <FlickeringGrid
                className="size-full"
                gridGap={4}
                squareSize={2}
                maxOpacity={0.5}
              />
            </motion.div>
          </div>
        ),

        title: "Sécurité avancée des données",
        description:
          "Protégez l'ensemble de vos données de gestion grâce à un chiffrement de pointe et un accès sécurisé à vos informations d'entreprise.",
      },
      {
        id: 2,
        content: (
          <div className="relative flex size-full max-w-lg items-center justify-center overflow-hidden [mask-image:linear-gradient(to_top,transparent,black_50%)] -translate-y-20">
            <Globe className="top-28" />
          </div>
        ),

        title: "Pensé pour les équipes",
        description:
          "Évoluez facilement avec votre organisation. Centralisez le suivi de vos opérations sur plusieurs espaces de travail et pour tous les membres de votre équipe.",
      },
    ],
  },
  quoteSection: {
    quote:
      "Notre solution SaaS simplifie la gestion quotidienne de notre entreprise. Les modules intégrés, comme les ressources humaines et la gestion des stocks, nous permettent de gagner un temps précieux et d’optimiser nos processus.",
    author: {
      name: "Alexandre Dupuis",
      role: "Directeur Technique, Innovatech",
      image: "https://randomuser.me/api/portraits/men/91.jpg",
    },
  },
  pricing: {
    title: "Des tarifs adaptés à la croissance de votre entreprise",
    description:
      "Quel que soit le forfait choisi, bénéficiez d'un essai gratuit pour découvrir notre plateforme de gestion. Sans engagement.",
    pricingItems: [
      {
        name: "Gratuit",
        href: "#",
        price: "0€",
        period: "mois",
        yearlyPrice: "0€",
        features: [
          "Gestion des utilisateurs",
          "Module RH de base",
          "Gestion simplifiée des stocks",
          "Support par email",
        ],
        description: "Idéal pour les petites entreprises ou l’essai de la solution",
        buttonText: "Commencer gratuitement",
        buttonColor: "bg-accent text-primary",
        isPopular: false,
      },
      {
        name: "Professionnel",
        href: "#",
        price: "19€",
        period: "mois",
        yearlyPrice: "190€",
        features: [
          "Gestion avancée des stocks",
          "Module de paie et RH complet",
          "Gestion des congés",
          "Suivi des ventes",
          "Intégration comptable",
          "Accès multi-utilisateurs",
          "Support prioritaire",
        ],
        description: "Pour les sociétés en croissance et les équipes dynamiques",
        buttonText: "Souscrire à Pro",
        buttonColor: "bg-secondary text-white",
        isPopular: true,
      },
      {
        name: "Entreprise",
        href: "#",
        price: "39€",
        period: "mois",
        yearlyPrice: "390€",
        features: [
          "Gestion multi-établissements",
          "Automatisations avancées",
          "Reporting personnalisé",
          "Module RH & Stocks illimités",
          "Gestion des accès avancée",
        ],
        description: "Conçu pour les grandes entreprises et les organisations exigeantes",
        buttonText: "Contacter le service commercial",
        buttonColor: "bg-primary text-primary-foreground",
        isPopular: false,
      },
    ],
  },
  testimonials: [
    {
      id: "1",
      name: "Sophie Martin",
      role: "Responsable RH chez AlphaCo",
      img: "https://randomuser.me/api/portraits/women/12.jpg",
      description: (
        <p>
          L’automatisation de la gestion RH a révolutionné notre organisation quotidienne.
          <Highlight>
            Moins d’erreurs, plus d’efficacité.
          </Highlight>{" "}
          Un gain de temps évident pour toute l’équipe.
        </p>
      ),
    },
    {
      id: "2",
      name: "Martin Dupont",
      role: "Gérant chez BioStock",
      img: "https://randomuser.me/api/portraits/men/45.jpg",
      description: (
        <p>
          Grâce au module de gestion des stocks, notre inventaire est toujours à jour et les ruptures sont évitées.
          <Highlight>Visibilité totale sur nos flux !</Highlight>{" "}
          Je recommande vivement cette solution pour PME.
        </p>
      ),
    },
    {
      id: "3",
      name: "Claire Petit",
      role: "Directrice des Opérations chez NextCorp",
      img: "https://randomuser.me/api/portraits/women/83.jpg",
      description: (
        <p>
          L’intégration entre les modules RH et comptabilité est fluide.
          <Highlight>Tout est centralisé en un seul endroit.</Highlight> La prise en main fut rapide et intuitive.
        </p>
      ),
    },
    {
      id: "4",
      name: "Jean Fournier",
      role: "Responsable IT chez Digisol",
      img: "https://randomuser.me/api/portraits/men/1.jpg",
      description: (
        <p>
          La sécurité des données et la gestion des accès nous rassurent au quotidien.
          <Highlight>
            Solution conforme RGPD.
          </Highlight>{" "}
          L’équipe support est toujours réactive.
        </p>
      ),
    },
    {
      id: "5",
      name: "Fatima Benali",
      role: "Directrice administrative chez Urbanis",
      img: "https://randomuser.me/api/portraits/women/5.jpg",
      description: (
        <p>
          L’automatisation des tâches administratives nous a permis de réduire significativement les papiers et erreurs.
          <Highlight>
            Gain de temps et sérénité retrouvée.
          </Highlight>{" "}
        </p>
      ),
    },
    {
      id: "6",
      name: "Kevin Moreau",
      role: "Chef de projet chez GreenLog",
      img: "https://randomuser.me/api/portraits/men/14.jpg",
      description: (
        <p>
          La gestion de stock en multi-établissements est un vrai plus pour notre activité logistique.
          <Highlight>
            Traçabilité et contrôle en temps réel.
          </Highlight>{" "}
        </p>
      ),
    },
    {
      id: "7",
      name: "Amélie Girard",
      role: "Responsable Marketing chez TrendyApp",
      img: "https://randomuser.me/api/portraits/women/56.jpg",
      description: (
        <p>
          L’accès multi-utilisateurs nous permet de mieux collaborer entre les équipes RH et commerciales.
          <Highlight>
            Chacun dispose des informations utiles à son métier.
          </Highlight>{" "}
        </p>
      ),
    },
    {
      id: "8",
      name: "Nicolas Dupuis",
      role: "Directeur IT chez MedSolution",
      img: "https://randomuser.me/api/portraits/men/18.jpg",
      description: (
        <p>
          Le suivi des performances et le reporting sont d’une grande précision.
          <Highlight>
            Décisions stratégiques facilitées !
          </Highlight>{" "}
        </p>
      ),
    },
    {
      id: "9",
      name: "Laure Mercier",
      role: "CEO chez EduForma",
      img: "https://randomuser.me/api/portraits/women/73.jpg",
      description: (
        <p>
          La personnalisation des modules RH et gestion a amélioré l’implication de nos équipes.
          <Highlight>
            Un SaaS adapté à toutes nos exigences.
          </Highlight>{" "}
        </p>
      ),
    },
    {
      id: "10",
      name: "Yannick Lefèvre",
      role: "CTO chez SécureTech",
      img: "https://randomuser.me/api/portraits/men/25.jpg",
      description: (
        <p>
          Grâce aux outils de sécurité intégrés, nos données sont protégées et l’accès est totalement maîtrisé.
          <Highlight>
            Tranquillité d’esprit au quotidien.
          </Highlight>{" "}
        </p>
      ),
    },
    {
      id: "11",
      name: "Sonia Lemoine",
      role: "Chef de produit chez CréaSolutions",
      img: "https://randomuser.me/api/portraits/women/78.jpg",
      description: (
        <p>
          Notre process créatif est beaucoup plus fluide grâce à l’automatisation des tâches répétitives.
          <Highlight>Priorité donnée à l’innovation.</Highlight>
        </p>
      ),
    },
    {
      id: "12",
      name: "Omar Bensaïd",
      role: "Fondateur chez StartUpHub",
      img: "https://randomuser.me/api/portraits/men/54.jpg",
      description: (
        <p>
          L’analyse intelligente des données RH et de stock nous offre un pilotage efficace de la croissance.
          <Highlight>
            Un atout précieux pour tout entrepreneur.
          </Highlight>{" "}
        </p>
      ),
    },
  ],
  faqSection: {
    title: "Foire aux questions",
    description:
      "Retrouvez ici les réponses aux questions les plus fréquentes sur notre plateforme SaaS et ses fonctionnalités. Pour toute autre demande, contactez notre support.",
    faQitems: [
      {
        id: 1,
        question: "Qu’est-ce qu’un logiciel SaaS de gestion d’entreprise ?",
        answer:
          "Un logiciel SaaS de gestion d’entreprise est une solution en ligne permettant de gérer différents aspects de l’activité, comme les ressources humaines, les stocks, la comptabilité, depuis une plateforme unique et sécurisée.",
      },
      {
        id: 2,
        question: "Quels modules sont inclus ?",
        answer:
          "Notre solution comprend entre autres : gestion des ressources humaines, gestion des stocks, suivi des ventes, intégration comptable, et reporting avancé. Chaque module est conçu pour optimiser votre activité.",
      },
      {
        id: 3,
        question: "Mes données sont-elles sécurisées ?",
        answer:
          "Oui. Nous utilisons des mesures de sécurité de niveau entreprise : chiffrement des données, centres de données sécurisés et contrôles d’accès avancés. Conformité RGPD garantie.",
      },
      {
        id: 4,
        question: "Peut-on connecter d’autres outils ?",
        answer:
          "Absolument ! Notre plateforme offre des APIs et des intégrations prêtes à l’emploi pour connecter facilement vos outils existants (comptabilité, CRM, etc.).",
      },
      {
        id: 5,
        question: "Y a-t-il un essai gratuit ?",
        answer:
          "Oui, un essai gratuit de 14 jours est proposé pour accéder à toutes les fonctionnalités. Aucun moyen de paiement n’est requis pour démarrer et vous pouvez arrêter à tout moment.",
      },
      {
        id: 6,
        question: "Comment ma société va-t-elle gagner du temps ?",
        answer:
          "L’automatisation des tâches courantes, la centralisation des données et des workflows simplifiés réduisent considérablement le temps consacré à la gestion. Vous vous concentrez sur l’essentiel !",
      },
    ],
  },
  ctaSection: {
    id: "cta",
    title: "Automatisez. Simplifiez. Réussissez.",
    backgroundImage: "/agent-cta-background.png",
    button: {
      text: "Essayez gratuitement",
      href: "/core/register",
    },
    subtext: "Annulez à tout moment, sans engagement",
  },
  footerLinks: [
    {
      title: "Entreprise",
      links: [
        { id: 1, title: "À propos", url: "#" },
        { id: 2, title: "Contact", url: "#" },
        { id: 3, title: "Blog", url: "#" },
        { id: 4, title: "Notre histoire", url: "#" },
      ],
    },
    {
      title: "Produits",
      links: [
        { id: 5, title: "RH", url: "#" },
        { id: 6, title: "Stocks", url: "#" },
        { id: 7, title: "Comptabilité", url: "#" },
        { id: 8, title: "Voir plus", url: "#" },
      ],
    },
    {
      title: "Ressources",
      links: [
        { id: 9, title: "Aide", url: "#" },
        { id: 10, title: "Carrières", url: "#" },
        { id: 11, title: "Newsletter", url: "#" },
        { id: 12, title: "Autres", url: "#" },
      ],
    },
  ],
};

export type SiteConfig = typeof siteConfig;
