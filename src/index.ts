import type { Components, ExtraProps, Options } from "react-markdown";
import type { PluggableList } from "unified";
import {
  createElement,
  type ComponentType,
  type PropsWithChildren,
  type ReactElement,
  type FunctionComponent,
} from "react";
import { rehypeMdxElements } from "rehype-mdx-elements";
import { remarkUnravelMdx } from "remark-unravel-mdx";
import remarkMdx from "remark-mdx";
import type { ZodType } from "zod";

export interface WithMdxOptions extends Options {
  remarkMdxPlugins?: PluggableList | null | undefined;
}

/**
 * Higher Order Component that wraps react-markdown with MDX syntax support
 *
 * This HOC takes a react-markdown component and returns a new component with MDX support.
 * It maintains the same interface as react-markdown while adding MDX JSX syntax processing.
 *
 * @param MarkdownComponent - The react-markdown component to enhance
 * @returns Enhanced component with MDX support
 */
export function withMdx(MarkdownComponent: ComponentType<Options>): ComponentType<WithMdxOptions> {
  return function ReactMarkdownWithMdx({
    components,
    remarkPlugins,
    remarkMdxPlugins,
    rehypePlugins,
    remarkRehypeOptions,
    ...props
  }: WithMdxOptions): ReactElement {
    // Extend user provided plugins with MDX required plugins
    const mergedRemarkPlugins: PluggableList = [
      remarkMdx,
      ...(remarkPlugins ?? []),
      remarkUnravelMdx,
      ...(remarkMdxPlugins ?? []),
    ];

    const allowedComponents = components ? Object.keys(components) : undefined;
    const mergedRehypePlugins: PluggableList = [
      [rehypeMdxElements, { allowedElements: allowedComponents }],
      ...(rehypePlugins ?? []),
    ];

    // Extend user provided remarkRehype options with MDX element node passthrough
    const mergedRemarkRehypeOptions: Options["remarkRehypeOptions"] = {
      passThrough: ["mdxJsxFlowElement", "mdxJsxTextElement"],
      ...remarkRehypeOptions,
    };

    return createElement(MarkdownComponent, {
      ...props,
      components,
      remarkPlugins: mergedRemarkPlugins,
      rehypePlugins: mergedRehypePlugins,
      remarkRehypeOptions: mergedRemarkRehypeOptions,
    });
  };
}

type ComponentProps = PropsWithChildren<ExtraProps>;

export type MdxComponents = Components & Record<string, FunctionComponent<ComponentProps>>;

export const mdxComponent = <P extends Record<string, unknown>>(
  Component: FunctionComponent<P>,
  validator: ZodType<P>,
): FunctionComponent<ComponentProps> => {
  const ReactMarkownComponent: FunctionComponent<ComponentProps> = ({ node, children }) => {
    const props = validator.parse({ ...node?.properties, children });
    return createElement(Component, {
      ...props,
    });
  };
  return ReactMarkownComponent;
};
