FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN npm --prefix frontend ci

COPY frontend ./frontend

ARG NEXT_PUBLIC_API_BASE=http://localhost:4000
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
ENV NODE_ENV=production

RUN npm --prefix frontend run build

EXPOSE 3000

CMD ["npm", "--prefix", "frontend", "run", "start", "--", "-p", "3000"]
