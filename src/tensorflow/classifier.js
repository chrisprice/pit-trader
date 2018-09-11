import * as tf from '@tensorflow/tfjs';
import { getPartialShape, partial } from './mobilenet';
import createSamplesStore from './samples';

export const BUY = 'buy';
export const SELL = 'sell';
const CLASS_NAMES = [BUY, SELL];
const CLASS_NAMES_LOOKUP = new Map(CLASS_NAMES.map((value, index) => [value, index]));
const NUM_CLASSES = CLASS_NAMES.length;
const BATCH_SIZE = 20;
const DENSE_UNITS = 100;
const EPOCHS = 20;
const LEARNING_RATE = 0.001;

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

model.compile({
    optimizer: tf.train.adam(LEARNING_RATE),
    loss: 'categoricalCrossentropy'
});

const loadModel = () => model;

const samples = createSamplesStore(2);

export const sample = async (className, image) => {
    const classId = CLASS_NAMES_LOOKUP.get(className);
    samples.add(
        await partial(image),
        tf.tidy(() => tf.oneHot(tf.tensor1d([classId]).toInt(), NUM_CLASSES))
    );
};

export const train = async (progressCallback) => {
    const model = await loadModel();
    return new Promise((resolve) => {
        model.fit(samples.get(0), samples.get(1), {
            batchSize: BATCH_SIZE,
            epochs: EPOCHS,
            callbacks: {
                onEpochEnd: async (index) => {
                    if (progressCallback != null) {
                        progressCallback((index + 1) / EPOCHS);
                    }
                },
                onTrainEnd: resolve
            }
        });
    });
};

export const predict = async (image) => {
    const activations = await partial(image);
    const model = await loadModel();
    const predictions = await model.predict(activations);
    activations.dispose();
    const probabilities = await predictions.data();
    predictions.dispose();
    return [...probabilities].map((probability, index) => ({
        className: CLASS_NAMES[index],
        probability
    }));
};
