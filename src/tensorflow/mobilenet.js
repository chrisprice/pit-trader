import { MobileNet } from '@tensorflow-models/mobilenet';

const VERSION = 1;
const ALPHA = 0.25;

let modelPromise = null;

const loadModel = () => {
    if (modelPromise == null) {
        const mobilenet = new MobileNet(VERSION, ALPHA);
        mobilenet.path = 'mobilenet_v1_0.25_224/model.json';
        modelPromise = mobilenet.load(VERSION, ALPHA)
            .then(() => mobilenet);
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
