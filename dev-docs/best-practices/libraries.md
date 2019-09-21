# Building Libraries

Taskcluster's libraries show a great deal more variety than the microservices.
They are designed specifically for use in our own services, but still provide a well-documented, understandable API.

Libraries should have simple names and be located in `libraries/` in this repository.
Each library should have its own `package.json`, with its `name` property set to `taskcluster-lib-<simpleName>`.
Dependencies should be listed in this `package.json`, with dev dependencies listed in the `package.json` in the repository root.

The `README.md` file should document the library's API completely, without relying on reference to the source.
This file will automatically be linked from the `README.md` in the root of the repository, via `yarn generate`.

Library source code should be in a `src` subdirectory.
No transpilation should be used: write JS that can be interpreted directly by the Node version in use in the repository.
The `main` property in `package.json` should point to `src/index.js`, which may then load other parts of the library.
