FROM node:lts-alpine3.14

WORKDIR /app

COPY package.json /app
RUN npm ci --only=production && npm cache clean --force
COPY . /app

CMD node main.js
