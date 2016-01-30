# Krist

This is the new official Krist node. It is written in Node.js.

## Dependencies

    "bluebird": "^3.1.1",
    "body-parser": "^1.14.2",
    "colors": "^1.1.2",
    "express": "^4.13.3",
    "moment": "^2.11.1",
    "request": "^2.67.0",
    "sequelize": "^3.17.1"

### Dev Dependencies

The following packages are also required for converting the database:

    "progress": "^1.1.8",
    "sqlite3": "^3.1.1",
    "yesno": "0.0.1"

_Note:_ The `mysql` package is required if you use `mysql` or `mariadb` as a Sequelize backend.

## Installation

Installation is fairly straight-forward. Simply clone the project, run `npm install` to install the required
dependencies and then run `node main`.

### Webserver Configuration

This Krist node is supposed to be ran behind a serverside proxy. The file `nginx_example.conf` includes a basic
configuration for how to set up the proxy in nginx. The Node.js webserver is not designed to and should not be exposed
to the public web, and should bind to a socket file.

You will need to create a socket file first. It is recommended to create a folder as the user you run your server as
where sockets can be privately written to. Set the sticky bit, and give the owner and group rwx perms. Do not give
world permissions.

Next, point your webserver to pass the requests at port 80 and 443 to this socket file. In nginx, this is as
straightforward as:

```
server {
    listen 80;
    listen 443 ssl;

    # Necessary SSL config

    server_name krist.example.com;

    location / {
        proxy_pass http://unix://var/sockets/krist.sock;
    }
}
```

You can also use an upstream to keepalive connections, like so:

```
upstream krist {
	server unix:/var/sockets/krist.sock;
	keepalive 8;
}

server {
    listen 80;
    listen 443 ssl;

    # Necessary SSL config

    server_name krist.example.com;

    location / {
        proxy_pass http://krist;
    }
}
```

The upstream method is also recommended for optimal performance.

Finally, make any additional changes, such as any proxy settings, upstream settings and your SSL configuration. You may
also point your 502 and 503 pages to static/down.html. This is done in nginx like this:

```
error_page 502 503 /down.html;
root /var/www-kristnode/static;

location /down.html {
}
```

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
