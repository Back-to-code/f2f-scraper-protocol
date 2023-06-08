# Spec for writing libaries

## `.env`

### `RTCV_SERVER` *Required*

Should define the RT-CV server to connect.

The env should have the following format:

```
http(s)://api_key_id:api_key_secret@rtcv.first2find.nl
```

The api credentials used in the url should be the scraper key.

### `RTCV_ALTERNATIVE_SERVER` *Optional*

A alternative RT-CV server to send CVs to.

This is optional and if unset or empty should not be used.

If used should follow the same rules as `RTCV_SERVER`

### `SERVER_PORT` *Optional*

If set should define the port number to expose the scraper webserver that implements (openapi.yaml)[./openapi.yaml].

Default: `2000`

## Internal server

### Auth

The internal server must be secured using basic auth,

Allowed login credentials should be the same as the credentials used to authenticate with RT-CV, this includes the alternative server.

