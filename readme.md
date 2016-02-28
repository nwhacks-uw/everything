# Cryptography hack at nwhacks 2016


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

```json
{
  id: Number,
  width: Number,
  height: Number,
  data: Number[]
}
```
