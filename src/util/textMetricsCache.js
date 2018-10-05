import createLazyMap from '../util/lazyMap';

export default (ctx) => createLazyMap(text => ctx.measureText(text));
