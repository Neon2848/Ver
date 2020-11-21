# Giuseppe Jr. II

[![Maintainability](https://api.codeclimate.com/v1/badges/409e726dc858ae9e6df5/maintainability)](https://codeclimate.com/github/SegFault-Verm/GiuseppeJrTheSecond/maintainability)
[![Code Climate issues](https://img.shields.io/codeclimate/issues/SegFault-Verm/GiuseppeJrTheSecond?color=45d298)](https://codeclimate.com/github/SegFault-Verm/GiuseppeJrTheSecond/maintainability)
[![Code Climate technical debt](https://img.shields.io/codeclimate/tech-debt/SegFault-Verm/GiuseppeJrTheSecond?color=45d298)](https://codeclimate.com/github/SegFault-Verm/GiuseppeJrTheSecond/maintainability)

[![GitHub package.json version](https://img.shields.io/github/package-json/v/SegFault-Verm/GiuseppeJrTheSecond)](https://github.com/SegFault-Verm/GiuseppeJrTheSecond/projects/1)

In development.

___

## Development

### Requirements
* node 14.0.0 or above
* [pm2](https://www.npmjs.com/package/pm2) should be installed globally with `npm i pm2 -g`, but you can avoid this by running `node src/index.js` instead of `npm run dev`.
* A local mongo installation, version 4.4.1
### Running
1) Add a secrets.json file with the info below.
2) `npm i` to install modules.
3) `npm run dev` to run pm2 in dev mode. `npm start` and `npm  stop` are used for deployment.

#### Secrets.json
```js
{
    "discord": {
        "token": ""
    },
    "mongo": {
        // Authless is fine as DB is only locally accessible.
        "server": "mongodb://127.0.0.1:27017/giuseppe"
    },
    "v3rm": {
      // You will need to stub the v3rmAPI, as it is not public at this time.
        "api": { 
            "base": "https://apipath",
            "lookup": "user",
            "unlink": "unlink",
            "warn": "warn",
            "ban": "ban"
        }
    },
    "wordFilters": {
        // Filters can be "word" or "/regex/",
        // but you do not need to account for filter evasion as config.characterEvasionMap is injected into the check.
        "slur": [],
        "exploit": [],
        "sensitive": [],
        "other": []
    }
}

```

---
## Contributing

I will likely not accept merge requests until the the project is complete. You can track progress [here](https://github.com/SegFault-Verm/GiuseppeJrTheSecond).

Install ESLint globally and follow the ESLint rules or your MR will not be accepted.

You can add bug reports and feature requests [here](https://github.com/SegFault-Verm/GiuseppeJrTheSecond/issues), but I will only be focusing on features that directly relate to existing tickets on the project tracker above until I am finished with the project.