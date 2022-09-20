FROM node:16-alpine AS build
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY tsconfig.json .
COPY src ./src
RUN npm run build

FROM node:16-alpine AS final
WORKDIR /app
COPY --from=build /app/package.json .
COPY --from=build /app/package-lock.json .
RUN npm install --production
COPY --from=build /app/out ./out
CMD node ./out/main.js
