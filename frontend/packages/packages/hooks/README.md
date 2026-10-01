# Hooks

Collection of React hooks used by NDLA

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [useComponentSize](#useComponentSize)

## Installation

```sh
$ pnpm add @ndla/hooks
```

## Usage

### useComponentSize

```js
import { useRef } from "react";
import useComponentSize from "@ndla/component-size";

function MyComponent() {
  let ref = useRef(null);
  let size = useComponentSize(ref);
  // size == { width: 100, height: 200 }
  let { width, height } = size;
  let imgUrl = `https://via.placeholder.com/${width}x${height}`;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <img ref={ref} src={imgUrl} />
    </div>
  );
}
```
