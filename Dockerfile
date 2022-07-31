# syntax=docker/dockerfile:1

# Installation ################################################################
# Set up our environment and install our dependencies.

FROM node:18-alpine AS installation
RUN addgroup api && adduser -S -G api api
RUN apk add dumb-init
USER api
WORKDIR /api
COPY package*.json ./

# Test ########################################################################
# Run test

FROM installation AS test
ENV NODE_ENV=test
ENV CONNECTIONSTRING=mongodb://mongodb:27017/taggerkeeper_test
RUN npm ci
RUN pwd
RUN ls node_modules
COPY . .
RUN npm test

# Production ##################################################################
# Run API

FROM installation AS production
ENV NODE_ENV=production
ENV CONNECTIONSTRING=mongodb://mongodb:27017/taggerkeeper
ENV ELASTICSEARCH=http://elasticsearch:9200
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 8080
CMD ["dumb-init", "node", "dist/server.js"]