export function jsx(type, props = {}, ...children) {
  let c = children.length
    ? children
    : props.children !== undefined
      ? [props.children]
      : [];

  return {
    type,
    props,
    children: c.flat(),
  };
}

export const jsxs = jsx;

export function Fragment(props) {
  return props.children ?? null;
}