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
