import * as mobilenet from '@tensorflow-models/mobilenet';

const VERSION = 1;
const ALPHA = 0.25;

let modelPromise = null;

const loadModel = () => {
    if (modelPromise == null) {
        modelPromise = mobilenet.load(VERSION, ALPHA);
    }
    return modelPromise;
};

export const partial = async (image) => {
    const model = await loadModel();
    return await model.infer(image, 'conv_pw_13_relu');
};

export const getPartialShape = () => [7, 7, 256];

export const classify = async (image, topk) => {
    const model = await loadModel();
    return await model.classify(image, topk);
};
