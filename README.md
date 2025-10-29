<!--
@since 2023.12.23, 16:55
@changed 2024.01.30, 19:29
@changed 2025.10.29 - Removed gulp, replaced with Node.js script
-->

# svelte-randonneur-app

Data browser editor for the [randonneur](https://github.com/brightway-lca/randonneur) project data.

- Version: 0.0.16
- Last changes timestamp: 2024.01.31, 21:08 +0700

## Resources

Repository: https://github.com/lilliputten/svelte-randonneur-app

Deploy demo server (with recent build): https://svelte-randonneur-app.lilliputten.ru

## Project workflow

### Svelte dev environment

This app is powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte).

### Installation

Install all required node dependencies:

```
npm install
```

This will automatically run post-install scripts to patch node packages as needed.

### Development

Start dev server (locate in browser with `http://localhost:3000`):

```
npm run start
```

### Build

Make build:

```
npm run build
```

The build process:
1. Compiles the Svelte app using Vite (`npm run svelte-build`)
2. Runs post-build tasks using a Node.js script (`npm run patch-build`)
   - Writes build information to `build/build.txt`

You can preview the production build with svelte's `npm run preview` or with smth like `npx serve build`.

### Publishing build

For successful publishing the build application the environment should be
properly set up (see npm script command `postinstall-publish-submodule`).

```
npm run build-and-publish
```

To just publish previously created build:

```
npm run publish
```

Builds published into the `publish` branch. See utilities configuration in
`utils/config.sh`. Builds deploy is set up using github web hooks.

### Download build

It's possible to download and server locally recent or specific builds.

All builds are stored in the branch [publish](https://github.com/lilliputten/svelte-randonneur-app/tree/publish).

To download recent build in a zip archive, use link:

https://codeload.github.com/lilliputten/svelte-randonneur-app/zip/refs/heads/publish

To download a specific version archive, use:

https://codeload.github.com/lilliputten/svelte-randonneur-app/zip/refs/tags/publish.0.0.13

## Container Deployment (Podman/Docker)

The application can be run in a container using Podman or Docker.

### Building the Container Image

Build the image using Podman:

```bash
podman build -t svelte-randonneur-app:latest .
```

Or using Docker:

```bash
docker build -t svelte-randonneur-app:latest .
```

### Running the Container

#### Using Podman

Run the container directly:

```bash
podman run -d -p 8080:80 --name svelte-randonneur-app svelte-randonneur-app:latest
```

Or using Podman Compose:

```bash
podman-compose up -d
```

#### Using Docker

Run the container directly:

```bash
docker run -d -p 8080:80 --name svelte-randonneur-app svelte-randonneur-app:latest
```

Or using Docker Compose:

```bash
docker-compose -f container-compose.yml up -d
```

### Accessing the Application

Once the container is running, access the application at:

```
http://localhost:8080
```

### Managing the Container

Stop the container:

```bash
podman stop svelte-randonneur-app
# or
podman-compose down
```

View logs:

```bash
podman logs svelte-randonneur-app
# or
podman-compose logs
```

Remove the container:

```bash
podman rm svelte-randonneur-app
# or
podman-compose down --rmi all
```

### Notes

- The container uses a multi-stage build for optimized image size
- The built application is served using nginx
- Build info includes git commit hash and branch (requires `.git` directory during build)
- Port 8080 on the host maps to port 80 in the container (configurable in `container-compose.yml`)
