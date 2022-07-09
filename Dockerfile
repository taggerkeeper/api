# Installation ################################################################
# Set up our environment and install our dependencies.

FROM node:18-alpine
ENV NODE_ENV production
RUN addgroup api && adduser -S -G api api
RUN apk add dumb-init
USER api
WORKDIR /api
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 8080

CMD ["dumb-init", "node", "server.js"]