# Development Documentation

This directory contains general information useful for people working on the Taskcluster codebase.
It should be used in concert with the READMEs for the services and libraries, and of course examination of the code itself.

The [Taskcluster monorepo](https://github.com/taskcluster/taskcluster) on Github contains the source code for all of the microservices, a collection of supporting libraries, and more.

See the [development process](development-process.md) for help getting started developing with the monorepo.

## RFCs

Taskcluster manages major changes to the platform through "requests for comment", known as RFCs.
These provide an open, transparent decision-making process and a way to track ideas from initial proposal through decision and implementation.

Taskcluster's RFCs are in the [taskcluster-rfcs repository](https://github.com/taskcluster/taskcluster-rfcs).

## Retrospectives

Taskcluster is used at Mozilla to support the core business of building, testing, and releasing Firefox and other products.
As such, we take failures very seriously and work to prevent them and learn from them.

In the interests of open development, we publish our retrospectives at [taskcluster/taskcluster-retrospectives](https://github.com/taskcluster/taskcluster-retrospectives).
Developers should be familiar with the incidents that have occurred in the past as a guide to designing new functionality in a way that will minimize likelihood of recurrence.

# Further Reading

* [Design Principles](principles.md)
* [Idempotency](idempotency.md)
* [Best Practices](best-practices)
