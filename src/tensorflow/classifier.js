import * as tf from '@tensorflow/tfjs';
import { getPartialShape, partial } from './mobilenet';
import createSamplesStore from './samples';

export const BUY = 'buy';
export const SELL = 'sell';
const CLASS_NAMES = [BUY, SELL];
const ID_TO_NAME = new Map(CLASS_NAMES.map((value, index) => [index, value]));
const NAME_TO_ID = new Map(CLASS_NAMES.map((value, index) => [value, index]));
const NUM_CLASSES = CLASS_NAMES.length;
const BATCH_SIZE = 20;
const DENSE_UNITS = 100;
const EPOCHS = 10;
const LEARNING_RATE = 0.0001;

const classifier = (model) => {
    model.compile({
        optimizer: tf.train.adam(LEARNING_RATE),
        loss: 'categoricalCrossentropy'
    });

    const samples = createSamplesStore(2);

    const sample = async (className, image) => {
        const activations = await partial(image);
        tf.tidy(() => {
            const expectedClassIds = tf.tensor1d([NAME_TO_ID.get(className)]).toInt();
            const expectedOutput = tf.oneHot(expectedClassIds, NUM_CLASSES);
            samples.add(
                activations,
                expectedOutput
            );
        });
    };

    const train = (progressCallback) =>
        new Promise((resolve) => {
            model.fit(samples.get(0), samples.get(1), {
                batchSize: BATCH_SIZE,
                epochs: EPOCHS,
                callbacks: {
                    onEpochEnd: async (index, foo) => {
                        console.log(foo);
                        if (progressCallback != null) {
                            progressCallback((index + 1) / EPOCHS);
                        }
                    },
                    onTrainEnd: resolve
                }
            });
        });

    const classify = async (image) => {
        const activations = await partial(image);
        const predictions = await model.predict(activations);
        activations.dispose();
        const probabilities = await predictions.data();
        predictions.dispose();
        return [...probabilities].map((probability, index) => ({
            className: ID_TO_NAME.get(index),
            probability
        }));
    };

    const save = async (path) => {
        await model.save(path);
    };

    return {
        sample,
        train,
        classify,
        save
    };
};

export const create = () => {
    const model = tf.sequential({
        layers: [
            tf.layers.flatten({
                inputShape: getPartialShape()
            }),
            tf.layers.dense({
                units: DENSE_UNITS,
                activation: 'relu',
                kernelInitializer: 'varianceScaling',
                useBias: true
            }),
            tf.layers.dense({
                units: NUM_CLASSES,
                kernelInitializer: 'varianceScaling',
                useBias: false,
                activation: 'softmax'
            })
        ]
    });
    return classifier(model);
}

export const load = async (path) => {
    const model = await tf.loadModel(path);
    return classifier(model);
};
