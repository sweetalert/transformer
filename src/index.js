export default async (params, {
  identifier,
  transformer,
}) => {

  let newOptions = await transformParams(
    params, 
    identifier, 
    transformer, 
  );

  const lastParam = params[params.length - 1];

  /*
   * So that we don't lose other specified options
   * such as buttons... etc.
   */
  if (isOptionsParam(lastParam, identifier)) {
    newOptions = Object.assign({}, lastParam, newOptions);
  }

  return newOptions;
};

// Return true if param is a SwalOptions object
const isOptionsParam = (param, isTransformable) => (
  (param.constructor === Object) && 
  (!isTransformable(param))
)

/*
 * @params: (SwalParams, Function, Function, boolean)
 * @returns: SwalOptions
 */
const transformParams = async (params, isTransformable, transformer) => {

  // Check if the transform returns a DOM synchronously
  // or if it is a promise:
  const isAsync = transformer() instanceof Promise;

  /*
   * Example:
   *   swal(<div>Hello!</div>);
   */
  const transformSingleParam = async () => {
    const el = params[0];

    if (!isTransformable(el)) return;

    const newContent = await transformEl(el, transformer, isAsync);

    return {
      content: newContent,
    };
  }

  /*
   * Example:
   *   swal("Hi", { 
   *     content: <div>Hello!</div> 
   *   })
   */
  const transformContentOption = async () => {
    const lastParamIndex = (params.length - 1);
    const lastParam = params[lastParamIndex];

    if (!lastParam || !lastParam.content) return;

    const { content } = lastParam;

    if (!isTransformable(content)) return;

    const newContent = await transformEl(content, transformer, isAsync);

    return {
      content: newContent,
    };
  }

  /*
   * Only transform the params that can 
   * have a DOM node as their value
   */
  const newOpts = await Promise.all([
    transformSingleParam(),
    transformContentOption(),
  ]);

  return Object.assign({}, ...newOpts);
}

// Transform a single option
const transformEl = async (el, transformer, isAsync) => {
  return (isAsync) ? await transformer(el) : transformer(el);
}

