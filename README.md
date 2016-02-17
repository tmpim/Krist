# Luran

This is the new official Luran node. It is written in Node.js.

## API Documentation

The documentation is generated with [apiDoc](http://apidocjs.com). It is automatically built by Grunt. You can find a
live copy of the API documentation [here](http://krist.ceriat.net/docs).

_Note:_ The `mysql` package is required if you use `mysql` or `mariadb` as a Sequelize backend.

## Installation

Installation is fairly straight-forward. Simply clone the project, run `npm install` to install the required
dependencies and then run `node main`.

### Webserver Configuration

This Krist node is supposed to be ran behind a serverside proxy. The file `nginx_example.conf` includes a basic
configuration for how to set up the proxy in nginx. The Node.js webserver is not designed to and should not be exposed
to the public web, and should bind to a socket file.

## Configuration

An example configuration file can be found at `config.example.js`. To configure the project, make a copy of this
file and change anything required, then save it to `config.js`.

## Converting the old SQLite data.db

A script is included for converting the old data.db files to the new database. The script assumes that you have
a correctly configured Sequelize connection, and a data.db file in the project root directory.

```
node convertdb
```

**Important:** This script will delete all rows in an existing Luran database. A list of tables that will be truncated
is listed when running the script. You will be prompted for confirmation prior to any actions being performed to
the database. The data.db file should remain unmodified.

## Licence

This project is released under **GPL-3.0**. More information can be found in the `LICENCE` file.
