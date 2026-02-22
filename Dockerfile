FROM node:20-alpine

# Installer pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Copier le reste du code
COPY . .

# # Construire l'application Next.js
# RUN pnpm build

# Exposer le port
EXPOSE 3000

# Démarrer l'application
CMD ["pnpm", "dev"]
