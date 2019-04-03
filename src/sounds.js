import { Howl, Howler } from 'howler';

const thumpHowl = new Howl({
    src: ['thump.ogg']
});

const coinHowl = new Howl({
    src: ['coin.ogg']
});

// Change global volume.
// Howler.volume(0.5);

export const coin = () => coinHowl.play();
export const thump = () => thumpHowl.play();