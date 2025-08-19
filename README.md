# react-markdown-with-mdx

Higher Order Component to add MDX syntax support to [react-markdown][react-markdown].

## Contents

- [What is this?](#what-is-this)
- [When should I use this?](#when-should-i-use-this)
- [Install](#install)
- [Use](#use)
- [API](#api)
- [Examples](#examples)
- [Security](#security)
- [Compatibility](#compatibility)
- [Related](#related)
- [License](#license)

## What is this?

This package provides a Higher Order Component that enhances [react-markdown][react-markdown] with MDX JSX syntax support.

The HOC processes markdown content to:
- Parse MDX syntax using [remark-mdx][remark-mdx]
- Transform MDX elements into React components
- Preserve all existing [react-markdown][react-markdown] functionality

## When should I use this?

Use this package when you want to:
- Add MDX component support to existing [react-markdown][react-markdown] implementations
- Use MDX component syntax without full MDX compilation
- Render MDX component content at runtime without executing arbitrary Javascript

Don't use this package if you need full MDX features like imports, exports, or expression execution - use [@mdx-js/mdx][mdx] instead.

## Install

This package is ESM only.

```sh
npm install react-markdown-with-mdx
```

You'll also need [`react`][react] and [`react-markdown`][react-markdown] as peer dependencies:

```sh
npm install react react-markdown
```

## Use

```jsx
import React from 'react'
import Markdown from 'react-markdown'
import { withMdx } from 'react-markdown-with-mdx'

// Create enhanced component
const MarkdownWithMdx = withMdx(Markdown)

// Define your custom components
const components = {
  Card: ({ children, variant = 'default' }) => (
    <div className={`card card-${variant}`}>{children}</div>
  ),
  Alert: ({ message, type = 'info' }) => (
    <div className={`alert alert-${type}`}>{message}</div>
  )
}

// Use with MDX JSX syntax
const markdown = `
# Hello MDX!

This is regular markdown with **bold** text.

<Card variant="primary">Hello!</Card>

<Alert message="This is an alert" type="warning" />
`

function App() {
  return (
    <MarkdownWithMdx components={components}>
      {markdown}
    </MarkdownWithMdx>
  )
}
```

## API

### `withMdx(MarkdownComponent)`

Higher Order Component that enhances a react-markdown component with MDX support.

#### Parameters

- `MarkdownComponent` (`React.ComponentType<Options>`) — The react-markdown component to enhance

#### Returns

Enhanced component (`React.ComponentType<WithMdxOptions>`) with MDX support.

### `WithMdxOptions`

Extended options interface that includes all `react-markdown` options plus:

- `remarkMdxPlugins` (`PluggableList`, optional) — Additional remark plugins specifically for MDX processing

All other options from [react-markdown][react-markdown] are supported, including:
- `components` — React components to use for rendering
- `remarkPlugins` — Additional remark plugins
- `rehypePlugins` — Additional rehype plugins
- `remarkRehypeOptions` — Options for remark-rehype

### `MdxComponents`

Component type for creating a components mapping object.

### `mdxComponent(Component, validator)`

```typescript
mdxComponent<P>(Component: React.FC<P>, validator: ZodType<P>) => React.FC<ComponentProps>
```

Optional validation helper function that takes a functional component along with a zod validator that ensures the `react-markdown` props are mapped to the provided component.

```tsx
interface CustomCardProps extends React.PropsWithChildren {
  id: string
  title: string
  type?: "standard" | "primary"
}

const CustomCard: React.FC<CustomCardProps> = memo(function CustomCard({
  id,
  title,
  type,
  children
}) {
  return <div data-id={id} className={type === "primary" ? "primary-card" : "standard-card"}>
    <h2>{title}</h2>
    {children}
  </div>
}

const components: MdxComponents = {
  CustomCard: mdxComponent(CustomCard,
    z.object({
      id: z.string(),
      title: z.string(),
      type: z.union([z.literal("standard"), z.literal("primary")]).optional(),
      children: z.any()
    })
  )
}
```

## Examples

### Basic Usage

```jsx
import { withMdx } from 'react-markdown-with-mdx'
import Markdown from 'react-markdown'

const MarkdownWithMdx = withMdx(Markdown)

const components = {
  CustomCard: ({ children, primary }) => (
    <div className={primary ? "primary-card" : "standard-card"}>{children}</div>
  )
}

const content = `
# My Document

<CustomCard type="primary">
  Hello There!
</CustomCard>
`

<MarkdownWithMdx components={components}>{content}</MarkdownWithMdx>
```

### Nested Components

```jsx
const components = {
  Card: ({ title, children }) => (
    <div className="card">
      <h3>{title}</h3>
      <div className="content">{children}</div>
    </div>
  ),
  Link: ({ url, children }) => <a href={url} className="card-link">{children}</a>
}

const content = `
<Card title="Welcome">
  This is a card with **markdown** content.

  <Link url="https://www.example.com">Action</Link>
</Card>
`
```

### With Additional Plugins

```jsx
const MarkdownWithMdx = withMdx(Markdown)

const customRemarkPlugin = () => (tree) => {
  // Your custom remark plugin logic
}

<MarkdownWithMdx
  components={components}
  remarkPlugins={[customRemarkPlugin]}
  remarkMdxPlugins={[/* MDX-specific plugins */]}
>
  {content}
</MarkdownWithMdx>
```

## Security

This package maintains the security model of [react-markdown][react-markdown]:

- Only components explicitly provided in the `components` prop are allowed
- JSX components not in the allowlist are completely removed
- All other security features of [react-markdown][react-markdown] are preserved

```jsx
// Only Card is allowed, script will be removed
const components = { Card: MyCard }

const unsafeContent = `
<Card>Safe</Card>
<script>alert('unsafe');</script>
`
// Result: Only the Card renders, script is removed
```

## Compatibility

This package works with:
- [React][react] 18+
- [react-markdown][react-markdown] 10+
- [Node.js][node] 18+

It uses ES modules and requires a modern JavaScript environment.

## Related

- [react-markdown][react-markdown] — The base markdown renderer
- [remark-mdx][remark-mdx] — MDX syntax support for remark
- [remark-unravel-mdx][remark-unravel-mdx] — Unravels MDX JSX to remove unnecessary paragraph wrappers
- [rehype-mdx-elements][rehype-mdx-elements] — Converts MDX elements to React components
- [@mdx-js/mdx][mdx] — Full MDX compiler

## License

[MIT][license] © [Tim Etler][author]

[license]: LICENSE.md
[author]: https://github.com/etler
[react]: https://reactjs.org/
[react-markdown]: https://github.com/remarkjs/react-markdown
[remark-mdx]: https://github.com/mdx-js/mdx/tree/main/packages/remark-mdx
[remark-unravel-mdx]: https://github.com/etler/remark-unravel-mdx
[rehype-mdx-elements]: https://github.com/etler/rehype-mdx-elements
[mdx]: https://github.com/mdx-js/mdx
[node]: https://nodejs.org/
