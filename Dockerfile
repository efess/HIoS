FROM node:boron

RUN mkdir -p /usr/src/app

# Set the working directory to /app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/

RUN npm install

# Copy the current directory contents into the container at /app
COPY . /usr/src/app

# Make port 80 available to the world outside this container
EXPOSE 8080

# Define environment variable
# ENV NAME World

CMD ["npm", "start"]