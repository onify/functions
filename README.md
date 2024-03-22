# Onify Functions

[![Build latest](https://github.com/onify/functions/actions/workflows/build.yaml/badge.svg)](https://github.com/onify/functions/actions/workflows/build.yaml)

**Onify Functions** is a set of REST-API functions based on [Node.js](https://nodejs.org/). It can be used in the Onify ecosystem, eg. Onify Flow or Onify Helix. You are also free to use outside of Onify. Good luck!

> NOTE: Onify Functions will soon replace [Onify Hub Functions](https://github.com/onify/hub-functions)!

- [Changelog](#changelog)
- [Functions](#functions)
- [Environment variables](#environment-variables)
- [Deploy](#deploy)
- [Development](#development)
- [Support](#support)
- [Contribute](#contribute)
- [License](#license)

## Changelog

### 2.0.0

First release...

## Functions

### Included functions

???

### Custom functions

???

## Environment variables

???

```
NODE_ENV=development

ONIFY_API_TOKEN="**"
ONIFY_API_URL=http://localhost:8181/api/v2
ONIFY_API_RESOURCES_DESTINATION = /custom/resources
ONIFY_API_RESOURCES_SOURCE = /

ONIFY_API_INTERNAL_PORT
ONIFY_API_URL
ONIFY_API_TOKEN
ONIFY_API_RESOURCES == true


ONIFY_INTERNAL_PORT=8585
ONIFY_EXTERNAL_PORT=8585
ONIFY_DEBUG_PORT=9228
```

## Deploy

### Docker

Here is an example how to run in Docker.

```yaml
functions:
  image: eu.gcr.io/onify-images/functions:latest
  pull_policy: always
  restart: always
  ports:
    - 8585:8585
```

### Kubernetes

Here is an example how to run in Kubernetes.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: onify-functions
spec:
  selector:
    matchLabels:
      app: functions
  template:
    metadata:
      labels:
        app: functions
    spec:
      imagePullSecrets:
        - name: onify-regcred
      containers:
        - name: functions
          image: eu.gcr.io/onify-images/functions:latest
          ports:
            - name: functions
              containerPort: 8585
---
apiVersion: v1
kind: Service
metadata:
  name: onify-functions
spec:
  ports:
    - protocol: TCP
      name: functions
      port: 8585
  selector:
    app: functions
```

## Development

### Install node modules

Install node modules in Windows:

```
$originalLocation = Get-Location
Get-ChildItem -Path . -Filter package.json -Recurse | Where-Object { $_.DirectoryName -notmatch "node_modules" } | ForEach-Object { Set-Location $_.DirectoryName; npm i; }
Set-Location -Path $originalLocation
```

Install node modules in Linux:

```
find . -name 'package.json' -not -path '**/node_modules/*' -execdir npm i \;
```

### Run

To run it, just execute command `npm start`.

### Testing

Run scripts of all unit test scenarios by executing `npm run test`.
API endpoints are documented and can be accessed in browser at http://localhost:8282/api-docs

### Debug

Start by running `npm run dev`, then hit `F5` in VScode.

> In VSCode, there is a built-in debugging functionality. To run in debug mode, please press F5. This will execute the commands stated in the launch.json file. You may place in break points in the line/s of code to verify a current status of variables during the process. In the upper right section of the code editor, you will see the debug controls for triggering when to play/pause the flow during runtime.

### Release

1. Update changelog in `README.md`
2. Update version in `package.json`
3. Commit the changes
4. Run `git tag v*.*.*` (eg. 1.1.0)
5. Run `git push --tags`

## Support

- Community/forum: https://support.onify.co/discuss
- Documentation: https://support.onify.co/docs
- Support and SLA: https://support.onify.co/docs/get-support

## Contribute

Sharing is caring! :-) Please feel free to contribute! Please read [Code of Conduct](CODE_OF_CONDUCT.md) first.
You can also create a new request (issue): https://github.com/onify/hub-functions/issues/new.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## TODO

- Document functions
- Document custom function
- Document environment vars
- Document hub api resources
- Use module name as category in swagger
- Move mergeImportData to other endpoint
