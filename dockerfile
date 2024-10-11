# FROM define the base image on which we will building 
# Use an official Node.js runtime as the base image
FROM node:18

# WORKDIR Sets the working directory for any subsequent RUN, CMD, ENTRYPOINT, COPY, and ADD commands.
# Set the working directory in the container
WORKDIR /usr/src/app

# # ADD Copies files or directories from the host system into the container’s filesystem.
# ADD . .

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install 

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# CMD run commands on the start of the container
# Start the Express app
CMD ["npm", "start"]
