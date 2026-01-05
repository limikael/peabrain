export function esbuildGlobalImportPlugin({ packageName, names }) {
  const namespace = "global-import";

  return {
    name: "global-import",
    setup(build) {

      // Intercept `import ... from "thepackage"`
      build.onResolve({ filter: new RegExp(`^${packageName}$`) }, () => {
        return {
          path: packageName,
          namespace,
        };
      });

      // Provide a virtual module
      build.onLoad({ filter: /.*/, namespace }, () => {
        const contents = names
          .map(name => `export const ${name} = global.${name};`)
          .join("\n");

        return {
          contents,
          loader: "js",
        };
      });
    },
  };
}