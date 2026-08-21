# NDLA frontend packages

Packages used to build UIs at NDLA.

## Publishing

### Publish packages to npmjs

```js
pnpm run publish
```

If script was interrupted, resulting in new versions being commited but not published to npm, this can be resolved by running

```
pnpm exec lerna publish from-package
```

## New Icons

### Download icon

As mentioned on https://designmanual.ndla.no/?path=/story/components--icons, new icons are downloaded from https://remixicon.com/. To avoid naming conflicts and duplicates, and also make it easy to check if an icon has already been imported, the naming chosen by RemixIcon has largely been kept. This means that:

- Icons are explicitly named 'Fill' or 'Line' for all variants wherever applicable
- Icon names are Camel case versions of the kebab case names on the website
- Sizing is written in full (link-m-line = LinkMediumLine, arrow-up-s-line = ArrowUpShortLine)
- Some icons have several variants, indicated by numbers. Since we won't be using more than one such variant, the number is omitted

Icons are downloaded and placed in the best matching sub-folder in `frontend-packages/packages/icons/svg/`. Edit the svg and add license information matching the other svg files.

### Generate typescript component file

Navigate to the root of frontend-packages and run `node scripts/createTsIconComponents.mjs`. This will generate typescript files for all the svg files, including the newly added one. When finished, create a PR with the new files (should only be svg and ts files). Make sure to publish frontend-packages for the new icons to be available.

## Upcoming features and updates

### Upcoming updates to the designmanual can be previewed here.

[Designmanual WIP](https://designmanual.ndla.no/?path=/story/velkommen--velkommen)
