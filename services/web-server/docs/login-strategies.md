# Login Strategies

Login strategies are dynamically loaded based on user configuration.
It's possible for a single deployment to use multiple strategies at the same time.

The [deployment documentation](../../../deployment-docs/login-strategies.md) has more information on how to set up and configure login strategies.
Update that documentation with any changes.

## Identities

This service uses an "identity" to name a user.
An identity has the form `<identityProviderId>/<details>` where `identityProviderId` matches the name of the strategy mananging the user, and `details` are specific to the strategy.

Identities must be unique -- no two users should have the same identity, even if they change some identifier such as primary email.

As an example, the GitHub strategy uses identities like `github/123|octocat`.
The `123` is the GitHub user's numeric user_id, which cannot be changed; the username (`octocat`) can be changed.
Including the user_id in the identity prevents a user from "stealing" another user's identity when that user changes usernames.

## User objects

Internally, this service uses a [User](../src/login/User.js) class to manage users.
Strategies are responsible for creating an instance of this class and adding roles to it with its `addRole` method.
The service then uses the `createCredentials` method to create temporary credentials suitable for calling Taskcluster API methods on behalf of the user.

## Strategy Classes

Strategies are implemented in files under [`services/web-server/src/login/strategies`](../src/login/strategies), in files named after the strategy.
Each file exports a class which is instantiated at service start-up if that strategy is configured.
Strategies not mentioned in the configuration are not even loaded, saving memory in the Node process.

The class must implement the following methods and properties:

* `constructor({name, cfg})` - `name` is the strategy name, and `cfg` is the service configuration
* `identityProviderId` - used to find the strategy to handle an identity
* `userFromIdentity(identity)` - given an identity for this strategy, return a suitable User object, or undefined if there is no such user.
  Only throw errors for failures to look up the given user.
* `useStrategy(app, cfg)` - set up the strategy to actually sign users in.
  `app` is the Express app for the service, and the method can manipulate it in whatever way necessary.
  The `/login` route is directed to the web-server app, so all added routes should have that prefix.
  Generally a strategy can use routes with prefix `/login/<identityProviderId>` for whatever is necessary.
