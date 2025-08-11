# Blog API README

Welcome to my blog repository! This is a blog API project built using `Node.js` and `Express.js`. The production version is live at **https://500kalima.site/node-api/articles**. This document provides a guide about how to setup and run the project as well as an overview of the available commands and their descriptions for managing migrations, seeders and server code. Please follow the instructions below:

---

## Prerequisites

Before you start using the project, ensure the following:

**1**. Setup a MySql database.

**2**. Ensure all necessary environment variables are set up. Refer to the `.env.example` file in the root directory (Client environment) and the server directory for guidance. **Note**: You do not need to configure AWS-related environment variables if you do not plan to use AWS.

---

## Optional

If you plan to use AWS as I do, set up or create an AWS account and configure the following services: an S3 bucket,AWS CloudFront, EC2 instance, Route 53 and IAM. Ensure the correct permissions are in place.

---

### Clone the repository

```bash
git clone git@github.com:AQA20/blog-api.git
cd blog-api
```

---

## Setup Server

### To install dependencies run:

```bash
npm run install
```

### Migrate All Migrations

To migrate all migrations:

```bash
npm run migrate
```

### Run Seeders

To run seeders:

```bash
npm run seed
```

### Run the app

To start app in development mode:

```bash
npm run dev
```

### Run the app in production

To run app in production mode:

```bash
npm run start
```

### After Deploying the app i'm using pm2 to run the server

### Running with PM2

To run the application using PM2, use:

```bash
pm2 start pm2.config.js --env .env
```

For deployment configuration details, check:

- `.github/workflows/main.yml` for CI/CD setup
- `pm2.config.cjs` for PM2 configuration

You can modify these configurations according to your needs.

---

## Other server available commands

### Format Code

To format code using eslint:

```bash
npm run lint
```

### Auto Fix ESLint Issues

To automatically fix eslint issues:

```bash
npm run lint:fix
```

### Format the code using prettier

To automatically format the code:

```bash
npm run format
```

### Create a New Migration

To create a new migration:

```bash
npm run migration:create migration-name
```

### Rollback Migrations One Step Backward

To rollback migrations one step backward:

```bash
npm run migrate:rollback
```

### Rollback All Migrations

To rollback all migrations (Use with caution and never use on deployment database):

```bash
npm run migrate:rollback:all
```

### Create a New Seeder

To create a new seeder:

```bash
npm run seed:create seed_name
```

### Rollback a Seeder One Step Backward

To rollback a seeder one step backward:

```bash
npm run seed:rollback
```

### To rollback All Seeders

To rollback all seeders (Use with caution and never use on deployment database):

```bash
npm run seed:rollback:all
```

---

## Note

Ensure that you exercise caution, especially when executing commands that affect migrations, seeders, and deployment environments. Always review changes before applying them to production databases.

---

## Contributing

Feel free to contribute to this project by submitting issues and pull requests. To get started, fork the repository and create a branch for your changes.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
