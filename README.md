# Krist

This is the official new Krist node. It is written in Node.js.

## Dependencies

    "bluebird": "^3.1.1",
    "body-parser": "^1.14.2",
    "colors": "^1.1.2",
    "express": "^4.13.3",
    "moment": "^2.11.1",
    "request": "^2.67.0",
    "sequelize": "^3.17.1"

## Dev Dependencies

The following packages are also required for converting the database:

    "progress": "^1.1.8",
    "sqlite3": "^3.1.1",
    "yesno": "0.0.1"

_Note:_ The `mysql` package is required if you use `mysql` or `mariadb` as a Sequelize backend.

## Installation

Installation is fairly straight-forward. Simply clone the project and run `node main`.

## Configuration

An example configuration file can be found at `config.example.js`. To configure the project, make a copy of this
file and change anything required, then save it to `config.js`.

## Converting the old SQLite data.db

A script is included for converting the old data.db files to the new database. The script assumes that you have
a correctly configured Sequelize connection, and a data.db file in the project root directory.

```
node convertdb
```

**Important:** This script will delete all rows in an existing Krist database. A list of tables that will be truncated
is listed when running the script. You will be prompted for confirmation prior to any actions being performed to
the database. The data.db file should remain unmodified.

## License

This project is released under **GPL-3.0**. More information can be found in the `LICENSE` file.
