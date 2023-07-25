export function twosComplement(input) {
    let sign = (input & 0x80) >> 7;
    if (sign == 1) {
        let magnitude = (input & 0x7F);
        for (let i = 0; i < 7; i++) {
            magnitude = (magnitude ^ (1 << i));
        }
        return -(magnitude + 1);
    }
    return input;
}