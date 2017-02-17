FROM node:7

WORKDIR /home

# Install app dependencies
COPY . /home
RUN npm install


EXPOSE 8080
CMD [ "npm", "start" ]