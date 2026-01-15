/*export function jsx(type, props={}, ...children) {
	children=children.flat();
	return {type, props, children};
}

export function jsxs(...args) {
	return jsx(...args);
}

export function Fragment(props) {
	//console.log(props);

	return props.children;
}*/

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