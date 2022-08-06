## Tagger Keeper API

This is the Tagger Keeper API. More to come 
once we get a little further and figure out 
how exactly we're going to use this.

### Environment Variables

You can set the following environment 
variables to configure each instance of the 
Tagger Keeper API.

#### API Location

Variable | Notes
--- | ---
`PROTOCOL` | The protocol that the API uses. (Default: `https`)
`DOMAIN` | The domain that the API is running on. (Default: `localhost`)
`PORT` | The port number that the API will run on. (Default: `8080`)
`APIPATH` | The path to the API on the domain. This should **not** include versioning; versioning is dynamically added, based on the `version` property in `package.json`. (Default: `/`)
`CONNECTIONSTRING` | The connection string used to connect to MongoDB. (Default: `mongodb://localhost/taggerkeeper`)
`DEFAULT_READ_PERMISSIONS` | Default read permissions for a new page. (Default: `anyone`)
`DEFAULT_WRITE_PERMISSIONS` | Default write permissions for a new page. (Default: `anyone`)
`DEFAULT_QUERY_LIMIT` | The number of pages that you’ll get back from a single search by default. (Default: `50`)
`MAX_QUERY_LIMIT` | The maximum number of pages that any single search will return. (Default: `1000`)