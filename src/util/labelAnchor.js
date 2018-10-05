export default ({ width, height, location, margin }) => {
    switch (location) {
        case 'bottom-left':
            return { x1: width, y1: 0, x2: width - margin, y2: margin };
        case 'top-left':
            return { x1: width, y1: height, x2: width - margin, y2: height - margin };
        case 'top-right':
            return { x1: 0, y1: height, x2: margin, y2: height - margin };
        case 'middle-right':
            return { x1: 0, y1: height / 2, x2: margin, y2: height / 2 };
        case 'bottom-center':
            return { x1: width / 2, y1: 0, x2: width / 2, y2: margin };
        case 'middle-left':
            return { x1: width, y1: height / 2, x2: width - margin, y2: height / 2 };
        case 'top-center':
            return { x1: width / 2, y1: height, x2: width / 2, y2: height - margin };
        case 'bottom-right':
        default:
            return { x1: 0, y1: 0, x2: margin, y2: margin };
    }
};