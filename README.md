# Onify Functions

[![Build latest](https://github.com/onify/functions/actions/workflows/build.yaml/badge.svg)](https://github.com/onify/functions/actions/workflows/build.yaml)

**Onify Functions** is a set of REST-API functions based on [Node.js](https://nodejs.org/). It can be used in the Onify ecosystem, eg. Onify Flow or Onify Helix. You are also free to use outside of Onify. Good luck!

> NOTE: Onify Functions will soon replace [Onify Hub Functions](https://github.com/onify/hub-functions)!

- [Changelog](#changelog)
- [Modules](#modules)
- [Custom modules](#custom-modules)
- [Environment variables](#environment-variables)
- [Deploy](#deploy)
- [Development](#development)
- [Support](#support)
- [Contribute](#contribute)
- [License](#license)

## Changelog

### 2.0.0

First release...

## Modules

### Active Directory

This module, named 'activedirectory', is used to interact with an Active Directory server. It provides a route to get users from Active Directory based on a filter.

#### GET /activedirectory/users

This route connects to the specified Active Directory server using the provided username and password, and retrieves users based on the provided LDAP filter and base DN. The scope parameter determines the scope of the search.

> This function is based on the [node-activedirectory](https://github.com/jsumners/node-activedirectory) library.

##### Query parameters

- `url`: The Active Directory server to connect to. For example, `ldap://ad.example.com`. This is a required parameter.
- `username`: An account name capable of performing the operations desired. For example, `test@domain.com`. This is a required parameter.
- `password`: The password for the given username. This is a required parameter.
- `filter`: The LDAP filter. For example, `(&(|(objectClass=user)(objectClass=person))(!(objectClass=computer))(!(objectClass=group)))`. This is a required parameter.
- `baseDN`: The root DN from which all searches will be performed. For example, `dc=example,dc=com`. This is a required parameter.
- `scope`: One of 'base', 'one', or 'sub'. Defaults to 'base'. This is an optional parameter.

### Convert

This module, named 'convert', is used to convert between XML and JSON formats. It provides two functions, one for converting XML to JSON and another for converting JSON to XML.

#### POST /convert/xml/json

This route takes in XML content and converts it to JSON. If the `ignoreAttributes` query parameter is set to true, the converter will ignore attributes in the XML content.

> This function is based on the [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) library.

##### Body

- `XML content`: The XML content to be converted. This is a required parameter.

##### Query parameters

- `ignoreAttributes`: If set to true, the converter will ignore attributes in the XML content. Defaults to true. This is an optional parameter.

#### POST /convert/json/xml

This route is used to convert JSON content to XML.

> This function is based on the [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) library.

##### Body

- `JSON content`: The JSON content to be converted. This is a required parameter.

### Dustin

This module, named 'dustin', is used for Dustin.
These resources are being used:

- `/resources/dustin/orderTemplate.xml`: This template is used as the base for building order XMLs.
- `/resources/dustin/orderRowTemplate.xml`: This template is used for each order row in the order XML.

#### POST /dustin/prepare/order

This route takes in order data and order rows, validates them against the `OrderValidation` and `OrderRowValidation` schemas respectively, and prepares an order in Dustin (xcbl) format.

##### Body

The body of the request should be a JSON object with the following properties:

- `Order`: An object that follows the `OrderValidation` schema. This is a required field.
- `OrderRows`: An array of objects, each following the `OrderRowValidation` schema. This is a required field.

### Excel

This module, named 'excel', is used to read Excel files and return data in JSON format. It provides a route to parse an uploaded Excel file and return its contents in JSON format.

#### POST /excel/read

This route takes in an Excel file, a schema, and a sheet name, and returns the contents of the Excel file in JSON format. The schema is used to validate the data in the Excel file, and the sheet name is used to specify which sheet to read in the Excel file.
The route handler uses the `read-excel-file` library to read the Excel file and validate its data against the provided schema. The handler also includes a middleware function that defines a `getParsedType` function.

##### Body

The body of the request should be a multipart/form-data object with the following properties:

- `schema`: A JSON object that describes the schema of the Excel file. This is an optional field. For more information, see [read-excel-file JSON schema](https://gitlab.com/catamphetamine/read-excel-file#json).
- `sheet`: The name of the sheet to read in the Excel file. By default, the first sheet in the document is read. This is an optional field.
- `file`: The Excel file to be read. This is a required field.

### LDAP

This module, named 'ldap', is used to interact with an LDAP server. It provides a route to perform a search operation against the LDAP server.

#### GET /ldap/search

This route connects to the specified LDAP server using the provided username and password, and performs a search operation. The `tlsOptions` query parameter can be used to specify the SSL/TLS options for the connection.

> This route is based on the [ldapjs](http://ldapjs.org) library.

##### Query parameters

- `url`: The LDAP server to connect to. For example, `ldap://ad.example.com`. This is a required parameter.
- `username`: An account name capable of performing the operations desired. For example, `test@domain.com`. This is a required parameter.
- `password`: The password for the given username. This is a required parameter.
- `tlsOptions`: An object that describes the SSL/TLS options for the connection. This is an optional parameter. The object can have the following properties:
  - `isServer`: Whether the TLS socket should be instantiated as a server. Defaults to false.
  - `reqCert`: Whether to authenticate the remote peer by requiring a certificate. Defaults to false.
  - `rejectUnauthorized`: Whether to reject unauthorized connections. Defaults to false.
- `base`: The root DN from which all searches will be performed. For example, `dc=example,dc=com`. This is a required parameter.
- `filter`: The LDAP filter. For example, `(&(|(objectClass=user)(objectClass=person))(!(objectClass=computer))(!(objectClass=group)))`. This is a required parameter.
- `scope`: One of 'base', 'one', or 'sub'. Defaults to 'base'. This is a required parameter.
- `attributes`: An array of attributes to select and return. Defaults to ['dn', 'sn', 'cn']. This is an optional parameter.
- `raw`: Either return the raw object (true) or a simplified structure (false). Defaults to false. This is an optional parameter.
- `paged`: Enable and/or configure automatic result paging. Defaults to false. This is an optional parameter.
- `pageSize`: The pageSize parameter sets the size of result pages reqed from the server. Defaults to 100 and cannot exceed 10000. This is an optional parameter.

### MSSQL

This module, named 'mssql', is used to interact with a Microsoft SQL Server. It provides a route to perform a query operation against the SQL Server.

#### GET /mssql/query

This route connects to the specified SQL Server using the provided username and password, and performs a query operation. The `encrypt` and `trustServerCertificate` query parameters can be used to specify the SSL/TLS options for the connection.

> This route is based on the [mssql](https://www.npmjs.com/package/mssql) library.

### Query parameters

- `server`: The SQL Server to connect to. This is a required parameter.
- `query`: The SQL query to execute. This is a required parameter.
- `port`: The port to connect to the SQL Server. Defaults to 1433. This is an optional parameter.
- `encrypt`: Whether to use SSL/TLS to encrypt the connection. Defaults to false. This is an optional parameter.
- `trustServerCertificate`: Whether to trust the server certificate. Defaults to false. This is an optional parameter.
- `database`: The database to connect to. This is a required parameter.
- `username`: The username to connect with. This is a required parameter.
- `password`: The password to connect with. This is a required parameter.

### SFTP

This module, named 'sftp', is used to interact with an SFTP server. It provides a route to read a file from the SFTP server.

#### GET /sftp/readfile

This route connects to the specified SFTP server using the provided username and password, and reads the specified file. The raw content of the file is then returned.

> This route is based on the [ssh2-sftp-client](https://www.npmjs.com/package/ssh2-sftp-client) library.

### Query Parameters:

- `filename`: The name of the file to read. This is a required parameter.
- `host`: The hostname or IP of the SFTP server. This is a required parameter.
- `port`: The port number of the SFTP server. Defaults to 22. This is an optional parameter.
- `username`: The username for authentication. This is a required parameter.
- `password`: The password for password-based user authentication. This is a required parameter.

### UNSPC

This module, named 'unspsc', is used to interact with UNSPSC® codes. It provides a route to get names by UNSPSC® codes.

#### POST /unspsc/names

This route takes in an array of UNSPSC® codes and returns their corresponding names. If `includeMeta` is true, the response will also include Segment, Family, Class. If `deepSearch` is true, the route will also search for the code in Segment, Family, Class, otherwise only in Commodity.

##### Body

The body of the request should be a JSON array of UNSPSC® codes.

##### Query parameters

- `includeMeta`: Whether to include Segment, Family, Class in the response. Defaults to true. This is an optional parameter.
- `deepSearch`: Whether to also search for code in Segment, Family, Class. Otherwise only Commodity. Defaults to true. This is an optional parameter.

## API Endpoints

#### GET /unspsc/{code}

This endpoint allows you to retrieve information about a specific UNSPSC code.

##### Query parameters

- `code`: The UNSPSC code you want to retrieve information for.

### Custom modules

_Coming soon..._

## Environment variables

- `NODE_ENV`: The environment in which the application is running.
- `PORT`: The port number on which the application will listen.
- `ONIFY_API_TOKEN`: The API token for accessing the Onify Hub API.
- `ONIFY_API_URL`: The URL of the Onify Hub API.
- `ONIFY_API_RESOURCES_DOWNLOAD`: Whether to enable the use of custom resources. Set to `true` to enable.
- `ONIFY_API_RESOURCES_DESTINATION`: The destination directory for storing custom resources.
- `ONIFY_API_RESOURCES_SOURCE`: The source directory for custom resources.
- `ONIFY_API_RESOURCES_PULL_INTERVAL`: How often to pull resources from Onify API. Default to 30 minutes.

Here is example of an `.env` file:

```bash
# -- Onify functions variables--
NODE_ENV=production
PORT=8585

# -- Onify Hub API variables --
ONIFY_API_TOKEN=****
ONIFY_API_URL=http://localhost:8181/api/v2
ONIFY_API_RESOURCES_DESTINATION=/custom/resources
ONIFY_API_RESOURCES_SOURCE=/
ONIFY_API_RESOURCES_DOWNLOAD=true
ONIFY_API_RESOURCES_PULL_INTERVAL=60
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

**Install node modules in Windows:**

```
$originalLocation = Get-Location
Get-ChildItem -Path . -Filter package.json -Recurse | Where-Object { $_.DirectoryName -notmatch "node_modules" } | ForEach-Object { Set-Location $_.DirectoryName; npm i; }
Set-Location -Path $originalLocation
```

**Install node modules in Linux:**

```
find . -name 'package.json' -not -path '**/node_modules/*' -execdir npm i \;
```

### Run

To run it, just execute command `npm start`.

### Testing

Run scripts of all unit test scenarios by executing `npm run test`.
API endpoints are documented and can be accessed in browser at http://localhost:8282/documentation

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

- Document custom function
- Document hub api resources
- Fix/Move mergeImportData to other endpoint
- Fix `npm run test`
