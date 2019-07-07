FROM node:10.16.0-alpine
WORKDIR /app
COPY . .
RUN ["npm", "install"]
ENTRYPOINT [ "npm", "run", "start" ]
