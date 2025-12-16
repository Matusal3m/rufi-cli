# Rufi CLI

Rufi CLI is a command-line interface tool designed to manage and streamline the development of services. It provides commands for managing services, migrations, and database schemas, making it easier to work with distributed systems and microservices.

## Features

- Clone and pull services from Git repositories.
- Manage database migrations for individual or all services.
- Reset and initialize the development environment.
- List database schemas and tables.

## Installation

```bash
npm i rufi-cli -D
```

or

```bash
bun i -d rufi-cli
```

## Before using it

1. Make sure your `.env` file looks like this:

```bash
# Required to run the CLI (the variable names can be changed in your rufi.config)
POSTGRES_HOST="localhost"
POSTGRES_DATABASE="postgres"
POSTGRES_USER="postgres"
POSTGRES_PORT="5432"
POSTGRES_PASSWORD='super-secret-password'

ENV='development' # any other value will disable dev commands

CORE_SERVICE=core

# Required to use service:* commands
GIT_TOKEN=your-git-token
GIT_USERNAME=username
```

2. Your PostgreSQL database is running and accepting connections.
3. You’re using `psql` (or a Docker container with it).
4. You have `git` installed (duh).

> Note: It may fail if:
>
> - The database is not running
> - Any credential is incorrect

## Usage

Run the CLI commands using the `rufi` binary.

### Initialize Configuration

Create the default configuration files (required before using the CLI):

```bash
npx rufi init --with-services [--ts]
```

> Note: The TypeScript config file is currently only used during CLI development.
> There’s no guarantee that it will work properly in your project. Prefer `.js` config files.

### Clone Services

Clone all services defined in the configuration:

```bash
npx rufi service:clone --all
```

### Pull Updates

Pull updates for a specific service:

```bash
npx rufi service:pull <service-name>
```

### Apply Migrations

Apply pending migrations for a specific service:

```bash
npx rufi migration:up <service-name>
```

### Reset Database

Reset the development database by dropping all schemas:

```bash
npx rufi db:reset
```

### Start Environment

Initialize the environment by cloning all services and applying migrations:

```bash
rufi start
```

For a full list of commands, use:

```bash
rufi --help
```
