# Back-end: node Express.js

## Quick start
```
    npm install
    npm start
```

The launched server will be listening on the port 5000.

Please consider the following section before launching the server.

## System environment variables

### `MONGO_URL`
ex)
```
http://127.0.0.1:27017/findyourchurch
```

### `FONT_URL`
ex)
```
http://127.0.0.1:8000/
```

## For the mailing

This project includes a fake account for testing.
For the production, it must be replaced by the real one.

The mail account is in:
`` /utils/fyc-mailer.js ``

When testing the Forgot-password, please check the received mails on:
``https://ethereal.email``

```
Email address: jared.lynch@ethereal.email
Password: w64kSZHEyyGkTfJtaz
```

## For the production
For the production, please consider a file: `/config/config.js`.
