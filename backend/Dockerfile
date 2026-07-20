FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# node-postgres reads "timestamp without time zone" columns using the
# process's local timezone; forcing UTC here keeps it aligned with
# Postgres's own UTC session timezone so created_at/updated_at values
# round-trip correctly instead of drifting by the server's UTC offset.
ENV TZ=UTC
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["sh", "-c", "node ./node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js && node dist/main"]
