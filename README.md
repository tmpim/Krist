# Krist

This is the new official Krist node. It is written in Node.js and TypeScript.

## Conventional Commits

Commit messages are written with 
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## [API Documentation](https://krist.dev/docs)

The documentation is generated with [apiDoc](https://apidocjs.com). You can find 
a live copy of the API documentation [here](https://krist.dev/docs).

## Docker Installation

The preferred method of installation is Docker. The Docker images are published
on the GitHub Container Registry under `ghcr.io/tmpim/krist`.

MySQL/MariaDB and Redis are required too. There are two options to connect to
the databases. The easier way is to run MySQL and Redis on the host machine,
and specify the `DB_HOST=${DOCKER_GATEWAY}` and `REDIS_HOST=${DOCKER_GATEWAY}`
environment variables to Krist. Alternatively, you can run MariaDB and Redis
in Docker too (left as an exercise to the reader).

Example usage with Docker Compose:

```yml
version: "3.9"
services:
  krist:
    image: "ghcr.io/tmpim/krist:latest"
    environment:
      - DB_PASS=${DB_PASS}
      - PUBLIC_URL=krist.dev
      - DB_HOST=172.17.0.1
      - REDIS_HOST=172.17.0.1
    ports:
      - "127.0.0.1:8080:8080"
    restart: unless-stopped
```

## Manual Installation

### Requirements

- Node.js v16
- MySQL or MariaDB
- Redis

#### Webserver Configuration

This Krist node is supposed to be ran behind a serverside proxy. The file
`casket_example.casket` includes a basic configuration for how to set up the
proxy in [Casket](https://github.com/tmpim/casket). The Node.js webserver is not
designed to and should not be exposed to the public web. HTTPS is required.

## Configuration

Basic configuration is now done via environment variables. You must supply the
following environment variables:

| Variable     | Default      | Description                                             |
|--------------|--------------|---------------------------------------------------------|
| `DB_PASS`    | **required** | The password of the database user.                      |
| `PUBLIC_URL` | **required** | The FQDN of the Krist server (e.g. `krist.dev`). |


The following optional environment variables may also be specified:

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `127.0.0.1` | The hostname of the database. |
| `DB_PORT` | `3306` | The port of the database. |
| `DB_NAME` | `krist` | The name of the database. |
| `DB_USER` | `krist` | The username of the database user. |
| `TEST_DB_NAME` | `test_krist` | *Required for testing*. If `NODE_ENV` is `test`, the name of the database. |
| `TEST_DB_USER` | `test_krist` | *Required for testing*. If `NODE_ENV` is `test`, the username of the database user. |
| `TEST_DB_PASS` |  | *Required for testing*. If `NODE_ENV` is `test`, the password of the database user. |
| `WEB_LISTEN` | `8080` | The port that the webserver listens on. |
| `REDIS_HOST` | `127.0.0.1` | The hostname of the redis server. |
| `REDIS_PORT` | `6379` | The port of the redis server. |
| `REDIS_PREFIX` | `krist:` | The prefix of the redis keys. |
| `TEST_REDIS_PREFIX` | `test_krist:` | *Required for testing*. If `NODE_ENV` is `test` (e.g. running Jest), the prefix of the redis keys. |
| `NODE_ENV` | `development` | Either `development` or `production`. If `development`, the Krist server runs in debug mode. |
| `FORCE_INSECURE` | `false` | If `true`, force the websocket gateway to return `ws://` URLs instead of `wss://`. Used for development only. |
| `GITHUB_TOKEN` |  | Any valid GitHub token (e.g. a PAT with no scopes) to obtain avatars for the homepage. Completely optional. |
| `USE_PROMETHEUS` | `false` | If `true`, enables Prometheus metrics on the `/metrics` endpoint. |
| `PROMETHEUS_PASSWORD` |  | If set, require HTTP basic authentication to access Prometheus metrics, with the username `prometheus`. |

For convenience, you may specify environment variables in a `.env` file.

## License

This project is released under **GPL-3.0**. More information can be found in the
`LICENSE` file.
