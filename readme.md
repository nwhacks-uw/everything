# Cryptography hack at NWHacks Spring 2016

Won 3rd place of PIA's Best Privacy, Security or Crypto Hack, and won Major League Hacking's best use of AWS.

## Relevant Sites

+ [Most reliable](https://eyrie.christopher.su/) and [alternate](http://nwhacks.dev.christopher.su/).
+ [Heroku](https://nwhacks.herokuapp.com/)
+ [Devpost](http://devpost.com/software/james-bond-s-webcam)

## Web Socket

Using socket.io

### Server-side Events
#### `uploadFrame`

### Client-side Events
#### `downloadFrame`
Load a new frame with `frame` data.

## Protocol

Frontend:

### `frame`

- `id`: The frame id
- `width`: The frame width
- `height`: The frame height
- `data`: A flat list of rgba values. (4 * width * height)
  - 0: R
  - 1: G
  - 2: B
  - 3: A

```js
{
  id: Number,
  width: Number,
  height: Number,
  data: Number[],
  timestamp: Date,
}
```

### How to build frontend

In a new tab run:

```sh
npm install -g watchify
npm run watch
```

### How to run

```sh
npm start
```
