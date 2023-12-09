# Vite Plugin for Facebook's Stylex

This project is a Vite plugin that provides support for Facebook's Stylex CSS-in-JS library.

Inspired by:
- <https://github.com/facebook/stylex/pull/66>

## Usage

First, install the plugin in your project:

```sh
npm install --save-dev vite-plugin-stylex-next
```

Then, add it to your `vite.config.ts`

```typescript
import { stylexPlugin } from 'your-plugin-name';

export default {
  plugins: [
    stylexPlugin(),
  ],
};
```

Then you should include the `virtual:stylex.css` in your entrypoint, like `main.ts`:

```tsx
import 'virtual:stylex.css';

// entry of Vue or React project
```

## Development

This project uses TypeScript for static typing and PNPM for package management.

To build the project, run:

```sh
npm run build
# or
npm run dev
```

This will compile the TypeScript code and output it to the [`dist`]("dist") directory.

## Contributing

Contributions are welcome! ~~Please read the contributing guide to get started. We'll probably write a guide in the future.~~

## License

This project is licensed under the MIT License.