FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm --prefix backend ci --omit=dev

COPY backend/src ./backend/src
COPY shared/src ./shared/src
COPY data ./data
COPY docs ./docs

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "backend/src/server.js"]
