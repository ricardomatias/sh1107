/**
 * Example for display 128x64 via I2C
 */
const { SH1107 } = require("../i2c");
const { I2C } = require('i2c');
const showcase = require("./gc-mono-showcase");
const led = 13;
pinMode(led, OUTPUT);

digitalToggle(led);

setInterval(() => {
  digitalToggle(led);
}, 1000);

console.log("Setting up I2C");
// try {
const i2c1 = new I2C(1, {scl: 3, sda: 2});

const sh1107 = new SH1107();
sh1107.setup(i2c1, {
  width: 128,
  height: 64,
});
