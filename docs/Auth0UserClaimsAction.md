# Auth0 User Claims Action

The backend user sync reads `name` and `email` from the verified API access token. Auth0 does not include those profile values in custom API access tokens by default, so add this Post Login Action in Auth0.

Auth0 Dashboard:

```txt
Actions -> Library -> Build Custom -> Post Login
```

Action code:

```js
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://api.udbhavi.local'
  const email = event.user.email

  const cleanValue = (value) => {
    if (typeof value !== 'string') {
      return ''
    }

    return value.trim()
  }

  const fullName = [event.user.given_name, event.user.family_name]
    .map(cleanValue)
    .filter(Boolean)
    .join(' ')

  const name = [fullName, event.user.name, event.user.nickname, event.user.username]
    .map(cleanValue)
    .find((value) => value && value.toLowerCase() !== email?.toLowerCase())

  if (email) {
    api.accessToken.setCustomClaim(`${namespace}/email`, email)
  }

  if (name) {
    api.accessToken.setCustomClaim(`${namespace}/name`, name)
  }
}
```

After saving it, attach the Action to the Login flow:

```txt
Actions -> Flows -> Login -> drag the Action into the flow -> Apply
```

Then log out and log in again so Auth0 issues a fresh access token with the new claims.

If `name` still does not appear in MongoDB, Auth0 does not have a real name for that user yet. In that case, update the Auth0 user profile with `given_name`, `family_name`, `nickname`, or `name`, then log in again.
