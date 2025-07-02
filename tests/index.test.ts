import React from "react";
import { render, screen } from "@testing-library/react";
import { withMdx } from "@/index";
import type { Parents as HastParents, Nodes as HastNodes } from "hast";
import type { Link as MdastLink, Parents as MdastParents } from "mdast";
import Markdown, { type Components } from "react-markdown";

const ReactMarkdownWithMdx = withMdx(Markdown);

// Test components for MDX integration
const TestButton: React.FC<{
  children?: React.ReactNode;
  variant?: string;
  disabled?: boolean;
}> = ({ children, variant = "default", disabled = false }) => {
  return React.createElement(
    "button",
    {
      "className": `btn btn-${variant}`,
      disabled,
      "data-testid": "test-button",
    },
    children,
  );
};

const TestAlert: React.FC<{
  message?: string;
  type?: string;
}> = ({ message, type = "info" }) => {
  return React.createElement(
    "div",
    {
      "className": `alert alert-${type}`,
      "data-testid": "test-alert",
    },
    message,
  );
};

const TestCard: React.FC<{
  title?: string;
  children?: React.ReactNode;
}> = ({ title, children }) => {
  return React.createElement(
    "div",
    {
      "className": "card",
      "data-testid": "test-card",
    },
    [
      title != null ? React.createElement("h3", { key: "title" }, title) : null,
      React.createElement("div", { key: "content", className: "card-content" }, children),
    ],
  );
};

const componentRegistry = {
  TestButton,
  TestAlert,
  TestCard,
};

type ComponentRegistry = Partial<typeof componentRegistry> & Components;

const components = componentRegistry as ComponentRegistry;

describe("ReactMarkdownWithMdx", () => {
  describe("Basic functionality", () => {
    it("should render plain markdown without JSX", () => {
      const markdown = "# Hello World\n\nThis is a paragraph.";

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components,
        }),
      );

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello World");
      expect(screen.getByText("This is a paragraph.")).toBeInTheDocument();
    });

    it("should render JSX components in markdown", () => {
      const markdown = `# Test

<TestButton variant="primary">Click me</TestButton>

<TestAlert message="Test message" type="warning" />`;

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components,
        }),
      );

      const button = screen.getByTestId("test-button");
      expect(button).toHaveTextContent("Click me");
      expect(button).toHaveClass("btn", "btn-primary");

      const alert = screen.getByTestId("test-alert");
      expect(alert).toHaveTextContent("Test message");
      expect(alert).toHaveClass("alert", "alert-warning");
    });

    it("should handle inline JSX components", () => {
      const markdown =
        'This is a paragraph with an <TestButton variant="secondary">inline button</TestButton> component.';

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components,
        }),
      );

      const button = screen.getByTestId("test-button");
      expect(button).toHaveTextContent("inline button");
      expect(button).toHaveClass("btn", "btn-secondary");
    });

    it("should handle nested JSX components", () => {
      const markdown = `<TestCard title="Card Title">
This is content inside the card.

<TestButton>Nested Button</TestButton>
</TestCard>`;

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components,
        }),
      );

      expect(screen.getByTestId("test-card")).toBeInTheDocument();
      expect(screen.getByText("Card Title")).toBeInTheDocument();
      expect(screen.getByText("This is content inside the card.")).toBeInTheDocument();
      expect(screen.getByTestId("test-button")).toHaveTextContent("Nested Button");
    });
  });

  describe("Security - Component allowlisting", () => {
    it("should block MDX components not in components object", () => {
      const markdown = `# Test

<TestButton>Allowed</TestButton>

<NotAllowed>Blocked</NotAllowed>`;

      const limitedComponents: ComponentRegistry = { TestButton };

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components: limitedComponents,
        }),
      );

      expect(screen.getByTestId("test-button")).toBeInTheDocument();
      expect(screen.queryByText("Blocked")).not.toBeInTheDocument();
      // NotAllowed should be blocked and completely removed (not converted to text)
      expect(screen.queryByText("NotAllowed")).not.toBeInTheDocument();
    });

    it("should block all MDX components when components object is empty", () => {
      const markdown = `<TestButton>Should be blocked</TestButton>
<TestAlert message="Also blocked" />`;

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components: {}, // Empty components object
        }),
      );

      expect(screen.queryByTestId("test-button")).not.toBeInTheDocument();
      expect(screen.queryByTestId("test-alert")).not.toBeInTheDocument();
      // Components should be completely removed when not in components object
      expect(screen.queryByText("Should be blocked")).not.toBeInTheDocument();
      expect(screen.queryByText("Also blocked")).not.toBeInTheDocument();
    });

    it("should respect react-markdown allowedElements for HTML filtering", () => {
      const markdown = `# Test

<TestButton>Button</TestButton>

Regular **bold** text`;

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components,
          allowedElements: ["TestButton", "p"],
        }),
      );

      // TestButton should be allowed and render as a button component
      expect(screen.getByTestId("test-button")).toBeInTheDocument();
      // Paragraph should be allowed
      expect(screen.getByText(/Regular/)).toBeInTheDocument();
      // Heading should be filtered out by react-markdown
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
      // Strong should be filtered out, but text content preserved
      expect(screen.getByText(/text/)).toBeInTheDocument();
    });

    it("should handle script tags securely", () => {
      const markdown = `# Test

<script>alert("XSS")</script>

<TestButton>Safe button</TestButton>`;

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components,
        }),
      );

      expect(screen.getByTestId("test-button")).toBeInTheDocument();
      // Script should be completely removed since it's not in components
      expect(screen.queryByText("alert")).not.toBeInTheDocument();
    });

    it("should respect react-markdown disallowedElements", () => {
      const markdown = `# Test

<TestButton>Button</TestButton>

Regular **bold** text`;

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components,
          disallowedElements: ["TestButton"],
        }),
      );

      // TestButton should be filtered out by react-markdown
      expect(screen.queryByTestId("test-button")).not.toBeInTheDocument();
      // TestButton content is completely removed when disallowed
      expect(screen.queryByText("Button")).not.toBeInTheDocument();
      // Other elements should still render
      expect(screen.getByRole("heading")).toBeInTheDocument();
      expect(screen.getByText("bold")).toBeInTheDocument();
    });
  });

  describe("Plugin extensibility", () => {
    it("should allow additional remark plugins", () => {
      const customRemarkPlugin = () => (tree: MdastParents) => {
        // Simple plugin that adds a footer link
        const link: MdastLink = { type: "link", children: [], url: "/", title: "footer" };
        tree.children = [...tree.children, link];
      };

      const markdown = "This is a test paragraph.";

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components,
          remarkPlugins: [customRemarkPlugin],
        }),
      );

      const link = screen.getByTitle("footer");
      expect(link).toHaveAttribute("href", "/");
    });

    it("should allow additional rehype plugins", () => {
      const customRehypePlugin = () => (tree: HastParents) => {
        // Simple plugin that adds a class to all headings
        const visitNode = (node: HastNodes) => {
          if (node.type === "element" && node.tagName === "h1") {
            node.properties["className"] = "custom-heading";
          }
          if ("children" in node && Array.isArray(node.children)) {
            node.children.forEach(visitNode);
          }
        };
        visitNode(tree);
      };

      const markdown = "# Custom Heading";

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components,
          rehypePlugins: [customRehypePlugin],
        }),
      );

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveClass("custom-heading");
    });

    it("should preserve user remarkRehypeOptions", () => {
      const markdown = "# Test\n\n<TestButton>Button</TestButton>";

      // Test that user options are merged with our defaults
      const userOptions = {
        footnoteLabel: "Custom footnotes",
        footnoteLabelTagName: "div",
      };

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components,
          remarkRehypeOptions: userOptions,
        }),
      );

      expect(screen.getByTestId("test-button")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle JSX components with no props", () => {
      const markdown = "<TestButton />";

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components,
        }),
      );

      const button = screen.getByTestId("test-button");
      expect(button).toHaveClass("btn", "btn-default");
    });

    it("should handle boolean attributes", () => {
      const markdown = "<TestButton disabled>Disabled Button</TestButton>";

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components,
        }),
      );

      const button = screen.getByTestId("test-button");
      expect(button).toBeDisabled();
    });

    it("should handle mixed markdown and JSX", () => {
      const markdown = `# Mixed Content

This is **bold** text with a <TestButton variant="primary">JSX button</TestButton> in it.

## Another heading

- List item 1
- List item with <TestAlert message="inline alert" type="info" />
- List item 3`;

      render(
        React.createElement(ReactMarkdownWithMdx, {
          children: markdown,
          components,
        }),
      );

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mixed Content");
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Another heading");
      expect(screen.getByText("bold")).toHaveStyle("font-weight: bold");
      expect(screen.getByTestId("test-button")).toBeInTheDocument();
      expect(screen.getByTestId("test-alert")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
    });
  });

  describe("Higher Order Component", () => {
    it("should work as an HOC with withMdx", () => {
      const CustomMarkdown = withMdx(Markdown);
      const markdown = "# HOC Test\n\n<TestButton>HOC Button</TestButton>";

      render(
        React.createElement(CustomMarkdown, {
          children: markdown,
          components,
        }),
      );

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("HOC Test");
      expect(screen.getByTestId("test-button")).toHaveTextContent("HOC Button");
    });

    it("should preserve the wrapped component's props interface", () => {
      // Test that the HOC doesn't break the original component's props
      const EnhancedMarkdown = withMdx(Markdown);
      const markdown = "# Props Test";

      render(
        React.createElement(EnhancedMarkdown, {
          children: markdown,
          components,
          // These are standard react-markdown props that should still work
          skipHtml: false,
          disallowedElements: ["script"],
        }),
      );

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Props Test");
    });
  });
});
