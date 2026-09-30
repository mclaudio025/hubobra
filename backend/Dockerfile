FROM node:18-alpine

WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production

# Copia código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Expõe porta
EXPOSE 8080

# Comando para iniciar
CMD ["npm", "run", "serve"]