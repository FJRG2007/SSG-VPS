## SSG-VPS >> Deploy Your SSG Projects on Your Own VPS using NodeJS 🏹

## Support

### Parallel
 - [ ] Astro
 - [ ] Native
 - [ ] Starlight
 - [ ] Vite
 - [ ] VitePress

## Deploying SSG Projects on Your VPS

Here are the steps to deploy your Static Site Generator (SSG) projects on your own VPS using NodeJS:

1. **Install NodeJS on your VPS**:
   Make sure NodeJS is installed on your VPS.

2. **Clone your project repository**:
   Clone your project repository to your VPS and navigate to the project directory.

3. **Install project dependencies**:
   Install the necessary dependencies for your project.

4. **Build the static site**:
   Build your static site using the SSG tool you are using.

5. **Use SSG-VPS**:
    Create a folder called server and inside it clone the content according to the framework you are going to use which you can find in this repository.
    Clone the code from the file, install the dependencies and you are done.

6. **Deploy**
    Execute the following command while in your project folder on your VPS.
    ```bash
    node server/app --YOUR_TECHNOLOGY
    ```
