# POC OneGeo-Client (Grand Lyon)

## Howto install

Prerequisites: NodeJs, ExpressJs.

```sh
git clone https://github.com/neogeo-technologies/gl-poc-onegeo-client.git
cd gl-poc-onegeo-client
npm install
bower install
cp routes/conf.json.model routes/conf.json
```

Edit `routes/conf.json`:

```json
{
    "es": {
        "client": {
            "host": "localhost:9200"
        },
        "index": "featurecollections",
    }
}
```

Then:

```sh
npm start
```
