import * as mobilenet from '@tensorflow-models/mobilenet';

const VERSION = 1;
const ALPHA = 0.25;

const modelPromise = mobilenet.load(VERSION, ALPHA);

const loadModel = () => modelPromise;

export const partial = async (image) => {
    const model = await loadModel();
    return await model.infer(image, 'conv_pw_13_relu');
};

export const getPartialShape = () => [7, 7, 256];

export const predict = async (image) => {
    const model = await loadModel();
    return await model.predict(image);
};
