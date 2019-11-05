# Next.js + Firebase

Build an optimized Firebase application from a Next.js serverless-build.

All static pages are hosted. Pages that need server-side-rendering will be added as a Function.
This insures a optimal way of hosting your application.

## Usage

```bash
next-to-firebase -n src/app -o dist
```

```
project/
  dist/            < Firebase application will be constructed here
  src/
    app/           < Next.Js applications
    functions/
      index.js     < Generic index.js where `//_exports_`-string gets replaced with page-functions
  firebase.json    < Generic firebase.json where `"_rewrites_"`-string gets replaced with the generated routes
  package.json
```
For more info see the example-directory.

## Installation
```bash
npm install --save-dev next-to-firebase
```

## Contributing

Contributions are more than welcome!
