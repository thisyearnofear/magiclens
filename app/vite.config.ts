import path from 'path'
import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import { runtimeLogger, preTransformLogger } from './src/vite-logger-plugin';

function createJsxLocationPlugin() {
  return (babel: any) => {
    const { types: t } = babel;

    return {
      name: "jsx-source-location",
      visitor: {
        JSXElement(path: any, state: any) {
          const loc = path.node.loc;
          const openingElement = path.node.openingElement;

          if (!loc || openingElement.attributes.some((attr: any) =>
            (t.isJSXAttribute(attr) && attr?.name?.name === "data-jsx-location"))) {
            return;
          }

          let componentName = "";
          if (t.isJSXIdentifier(openingElement.name)) {
            componentName = openingElement.name.name;
          } else if (t.isJSXMemberExpression(openingElement.name)) {
            componentName = getFullMemberExpressionName(openingElement.name);
          }

          if (state.filename.includes('/ui/')) {
            return;
          }

          const pathComponents = state.filename.split('/');
          const fileName = pathComponents[pathComponents.length - 1];
          const locationString = `${fileName}|${loc.start.line}|${loc.start.column}|${componentName}`;
          const sourceAttribute = t.jsxAttribute(
            t.jsxIdentifier("data-jsx-location"),
            t.stringLiteral(locationString)
          );

          openingElement.attributes.push(sourceAttribute);
        }
      }
    };
  };
}

function getFullMemberExpressionName(expr: any) {
  let result = "";

  if (expr.type === "JSXMemberExpression") {
    result = getFullMemberExpressionName(expr.object) + "." + expr.property.name;
  } else if (expr.type === "JSXIdentifier") {
    result = expr.name;
  }

  return result;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [react({
      babel: {
        plugins: [
          createJsxLocationPlugin()
        ]
      }
    }), !isProd && runtimeLogger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      hmr: {
        overlay: false
      },
      allowedHosts: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/media': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    customLogger: isProd ? undefined : preTransformLogger(createLogger(), '../logs/vite.log'),
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
  }
})
