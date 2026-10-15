# Sharing location

A signed-in person can agree that Sticky may use their GPS to keep the map on them. That agreement is Consenting for one Feature, `sharingLocation`. The page never asks the browser for GPS until Consenting records that they consent. They can withdraw the same way they gave it. People who are not signed in are refused with `NOT_SIGNED_IN`.

The [consent endpoint](reaction:location.sharing.ConsentLocation) reads the user from the session with `Sessioning.use`, then calls `Consenting.consent` for the Feature `sharingLocation` named in the request. A second consent is refused with `ALREADY_CONSENTED`. Requests that name a different Feature are refused as invalid.

```endpoints
location.sharing.ConsentLocation at /location/consent
```

The [withdraw endpoint](reaction:location.sharing.WithdrawLocation) reads the user from the session, then `Consenting.withdraw` for `sharingLocation`. Withdrawing without a consent is refused with `NOT_CONSENTED`.

```endpoints
location.sharing.WithdrawLocation at /location/withdraw
```

The page can [read whether they currently consent](reaction:location.sharing.ReadLocationConsent). That endpoint reads the user from the session, then `Consenting._consented` for `sharingLocation`.

```endpoints
location.sharing.ReadLocationConsent at /location/status
```
