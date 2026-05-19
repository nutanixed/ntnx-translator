FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
RUN npm --prefix backend ci --omit=dev && npm --prefix shared ci --omit=dev

COPY backend/src ./backend/src
COPY shared/src ./shared/src
COPY scripts ./scripts
COPY data ./data
COPY docs ./docs

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "backend/src/server.js"]
