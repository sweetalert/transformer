import swal from 'sweetalert';

export default async (...args) => {
  const newOptions = await getOptions(...args);

  return swal(newOptions);
}

export const bindActions = (swalInstance) => {
  for (const method in swal) {
    swalInstance[method] = swal[method];
  }
}

const getOptions = async (params, {
  identifier,
  transformer,
}) => {

  let newOptions = await transformParams(
    params, 
    identifier, 
    transformer, 
  );

  newOptions = Object.assign({}, parseTextParams(params), newOptions);

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

const parseTextParams = params => {
  const options = {};

  const isString = param => typeof param === "string";

  if (isString(params[0]) && !isString(params[1])) {
    options.text = params[0];
  }

  if (isString(params[1])) {
    options.title = params[0];
    options.text = params[1];
  }

  if (isString(params[2])) {
    options.icon = params[2];
  }

  return options;
}

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

    let { content, button } = lastParam;

    if (isTransformable(content)) {
      content = await transformEl(content, transformer, isAsync);
    }

    /* TODO?
    if (isTransformable(button)) {
      button = await transformEl(button, transformer, isAsync);
    }
    */

    return {
      content,
      //button,
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

