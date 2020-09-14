# Krist

This is the new official Krist node. It is written in Node.js.

## Repo Guidelines
- All code and commits are made in British English (Not Simplified American English)
- As of 2020, commits are made with [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## API Documentation

The documentation is generated with [apiDoc](http://apidocjs.com). You can find 
a live copy of the API documentation [here](http://krist.ceriat.net/docs).

## Installation

Installation is fairly straight-forward. Simply clone the project, run 
`npm i` to install the required dependencies and then run `node main`.

### Webserver Configuration

This Krist node is supposed to be ran behind a serverside proxy. The file
`casket_example.casket` includes a basic configuration for how to set up the
proxy in [Casket](https://github.com/tmpim/casket). The Node.js webserver is not
designed to and should not be exposed to the public web.

## Configuration

An example configuration file can be found at `config.example.js`. To configure
the project, make a copy of this file and change anything required, then save it
to `config.js`.

## Licence

This project is released under **GPL-3.0**. More information can be found in the
`LICENCE` file.
