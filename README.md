# app_to_pstn_example

Here's an example of a back end connecting an app to PSTN via the Vonage Voice SDK 


## install it

clone the repo

```bash
cd app_to_pstn_example
nvm use
npm i
```

## run it

```bash
npm start
```

## request examples:

create a user called `user1`

```bash
curl -X POST 'localhost:5001/api/subscribe' \
--header 'Content-Type: application/json' \
-d '{
    "username": "user1"
}'
```

get a token for `user1`

```bash
curl -X POST 'localhost:5001/api/login' \
--header 'Content-Type: application/json' \
-d '{
    "username": "user1"
}'
```




get user info for use `user1`

```bash
curl localhost:5001/api/users/user1
```

get users list

```bash
curl localhost:5001/api/users | jq .
```


