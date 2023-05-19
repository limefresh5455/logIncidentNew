FROM node:16.14.2-alpine AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN  npm install
RUN npm install npm@latest -g
COPY . .
RUN npm run build --prod --omit=dev

### STAGE 2: Run ###
FROM nginx:1.17.1-alpine
COPY default.conf /etc/nginx/conf.d/default.conf
COPY certs /etc/nginx/certs
COPY --from=build /usr/src/app/dist /usr/share/nginx/html/dist
