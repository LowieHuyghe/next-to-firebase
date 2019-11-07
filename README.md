# Next.js + Firebase

![npm](https://img.shields.io/npm/v/next-to-firebase)

Build an optimized Firebase application from a Next.js serverless-build.

All static pages are hosted. Pages that need server-side-rendering will be added as a Function.
This insures a optimal way of hosting your application.

## Installation
```bash
npm install --save-dev next-to-firebase
```

## Usage

Using the command line:
```bash
next-to-firebase -n src/app -o dist
```

In code:
```typescript
import { run } from 'next-to-firebase'
run(rootDir, relativeNextAppDir, relativeDistDir)
```

Result:
```
project/
  dist/            < Firebase application will be constructed here
  src/
    app/           < Next.Js applications
    functions/
      index.js     < Generic index.js where `//_exports_`-string gets replaced with page-functions
  firebase.json    < Generic firebase.json where `"_rewrites_"`-string gets replaced with the generated routes
  package.json     < Will get copied to functions-directory in dist so dependencies and engine will be managed here
```
For more info see the [example-directory](https://github.com/LowieHuyghe/next-to-firebase/tree/master/example).

## Contributing

Contributions are more than welcome!
